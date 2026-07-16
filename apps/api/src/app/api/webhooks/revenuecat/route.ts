import { NextRequest } from "next/server";
import crypto from "crypto";
import { query } from "@calm-stories/db";
import { success, error, unauthorized, serverError } from "@/app/lib/response";
import { PREMIUM_ENTITLEMENT_ID } from "@calm-stories/shared";

// POST /api/webhooks/revenuecat — subscription lifecycle events.
// Configure in the RevenueCat dashboard (Integrations → Webhooks) with the
// URL of this route and REVENUECAT_WEBHOOK_SECRET as the Authorization
// header value. RevenueCat retries any non-2xx response, so unknown or
// irrelevant events must still return 200.

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Events where the entitlement is (still) granted and the expiry moves.
// CANCELLATION and BILLING_ISSUE only affect auto-renewal — access lasts
// until the expiration date, and the later EXPIRATION event clears it.
const UPSERT_EVENTS = new Set([
  "INITIAL_PURCHASE",
  "RENEWAL",
  "UNCANCELLATION",
  "NON_RENEWING_PURCHASE",
  "PRODUCT_CHANGE",
  "SUBSCRIPTION_EXTENDED",
  "CANCELLATION",
  "BILLING_ISSUE",
]);

function timingSafeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

// Our RevenueCat app-user IDs are users.id UUIDs; anything else (e.g.
// $RCAnonymousID:…) can't be matched to an account.
function isUserId(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

function resolveUserId(event: any): string | null {
  const candidates: unknown[] = [
    event.app_user_id,
    event.original_app_user_id,
    ...(Array.isArray(event.aliases) ? event.aliases : []),
  ];
  return (candidates.find(isUserId) as string | undefined) ?? null;
}

async function grantEntitlement(
  userIds: string[],
  expiresAt: Date | null,
  store: string | null
): Promise<void> {
  await query(
    `UPDATE users
     SET entitlement = $1, entitlement_expires_at = $2, entitlement_store = $3
     WHERE id = ANY($4::uuid[])`,
    [PREMIUM_ENTITLEMENT_ID, expiresAt, store, userIds]
  );
}

async function clearEntitlement(userIds: string[]): Promise<void> {
  await query(
    `UPDATE users
     SET entitlement = NULL, entitlement_expires_at = NULL, entitlement_store = NULL
     WHERE id = ANY($1::uuid[])`,
    [userIds]
  );
}

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.REVENUECAT_WEBHOOK_SECRET;
    if (!secret) {
      // Refuse rather than silently accept unauthenticated events.
      return error("Webhook secret not configured", 503);
    }

    const header = req.headers.get("authorization") || "";
    if (!timingSafeEqual(header, secret)) {
      return unauthorized("Invalid webhook authorization");
    }

    const body = await req.json();
    const event = body?.event;
    if (!event?.type) {
      return error("Malformed webhook payload");
    }

    const expiresAt = event.expiration_at_ms
      ? new Date(event.expiration_at_ms)
      : null;
    const store =
      typeof event.store === "string" ? event.store.toLowerCase() : null;

    // TRANSFER moves purchases between app users and carries no
    // entitlement_ids — move our premium flag along with it. It also has no
    // expiration date, so grant a bounded window (a monthly period plus
    // slack) rather than "never expires"; the next RENEWAL event replaces it
    // with the real date, and EXPIRATION still clears it early.
    if (event.type === "TRANSFER") {
      const TRANSFER_WINDOW_MS = 35 * 24 * 60 * 60 * 1000;
      const from = (event.transferred_from ?? []).filter(isUserId);
      const to = (event.transferred_to ?? []).filter(isUserId);
      if (from.length > 0) await clearEntitlement(from);
      if (to.length > 0) {
        await grantEntitlement(
          to,
          expiresAt ?? new Date(Date.now() + TRANSFER_WINDOW_MS),
          store
        );
      }
      return success({ handled: event.type });
    }

    // Every other event names the entitlements it affects.
    const entitlementIds: unknown[] = Array.isArray(event.entitlement_ids)
      ? event.entitlement_ids
      : [];
    if (!entitlementIds.includes(PREMIUM_ENTITLEMENT_ID)) {
      return success({ ignored: "entitlement not relevant" });
    }

    const userId = resolveUserId(event);
    if (!userId) {
      // Anonymous purchase — a TRANSFER event follows once the buyer logs in.
      return success({ ignored: "no matching app user id" });
    }

    if (event.type === "EXPIRATION") {
      await clearEntitlement([userId]);
    } else if (UPSERT_EVENTS.has(event.type)) {
      await grantEntitlement([userId], expiresAt, store);
    }
    // Unhandled types (e.g. TEST) fall through to 200 so RC doesn't retry.

    return success({ handled: event.type });
  } catch (err) {
    return serverError(err);
  }
}
