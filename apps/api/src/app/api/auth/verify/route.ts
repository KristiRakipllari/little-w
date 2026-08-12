import { NextRequest } from "next/server";
import { queryOne, query } from "@calm-stories/db";
import { rateLimit } from "@/app/lib/rateLimit";
import { hashVerificationToken, isWellFormedToken } from "@/app/lib/verification";
import { renderVerifyPage, htmlResponse, parseLocale } from "@/app/lib/verifyPage";
import type { SupportedLocale } from "@calm-stories/shared";

// Token-bearing route: never cache, never statically evaluate.
export const dynamic = "force-dynamic";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_VIEWS = 20;
const MAX_CONFIRMS = 10;

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function invalid(locale: SupportedLocale): Response {
  // One page for malformed, unknown, expired and already-consumed tokens —
  // distinguishing them would tell a prober which tokens ever existed.
  return htmlResponse(renderVerifyPage("invalid", locale), 400);
}

/**
 * GET — renders a confirmation page. Deliberately does NOT consume the token.
 *
 * Outlook SafeLinks, Proofpoint, Gmail and corporate AV all issue unsolicited
 * GETs against every URL in an inbound email, often within seconds. If GET
 * consumed the token, a scanner would burn it and the parent would click a
 * dead link. Scanners fetch; they do not submit forms — so consumption lives
 * in POST. (This is also plain HTTP correctness: GET must not have side
 * effects.)
 */
export async function GET(req: NextRequest) {
  const locale = parseLocale(req.nextUrl.searchParams.get("lang"));

  if (!rateLimit(`verifyLink:${clientIp(req)}`, MAX_VIEWS, WINDOW_MS)) {
    return invalid(locale);
  }

  const token = req.nextUrl.searchParams.get("token") ?? "";
  if (!isWellFormedToken(token)) return invalid(locale);

  const record = await queryOne<{ id: string }>(
    `SELECT id FROM email_verification_tokens
     WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()`,
    [hashVerificationToken(token)]
  );
  if (!record) return invalid(locale);

  return htmlResponse(renderVerifyPage("confirm", locale, token), 200);
}

/** POST — consumes the token and flips the flag. Submitted by the GET form. */
export async function POST(req: NextRequest) {
  let locale: SupportedLocale = "en";
  try {
    locale = parseLocale(req.nextUrl.searchParams.get("lang"));

    if (!rateLimit(`verifyConfirm:${clientIp(req)}`, MAX_CONFIRMS, WINDOW_MS)) {
      return invalid(locale);
    }

    const form = await req.formData();
    const token = String(form.get("token") ?? "");
    if (!isWellFormedToken(token)) return invalid(locale);

    const tokenHash = hashVerificationToken(token);

    // Consume and check in one statement: the `used_at IS NULL` predicate
    // makes this atomic against a double-submit, with no explicit transaction.
    const consumed = await queryOne<{ user_id: string }>(
      `UPDATE email_verification_tokens
       SET used_at = NOW()
       WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()
       RETURNING user_id`,
      [tokenHash]
    );

    if (!consumed) {
      // Already spent. If the account is verified, this is a double-click or a
      // back-button resubmit — showing an error there would alarm someone who
      // did nothing wrong.
      const already = await queryOne<{ email_verified: boolean }>(
        `SELECT u.email_verified
         FROM email_verification_tokens t
         JOIN users u ON u.id = t.user_id
         WHERE t.token_hash = $1`,
        [tokenHash]
      );
      if (already?.email_verified) {
        return htmlResponse(renderVerifyPage("success", locale), 200);
      }
      return invalid(locale);
    }

    await query("UPDATE users SET email_verified = true WHERE id = $1", [
      consumed.user_id,
    ]);

    return htmlResponse(renderVerifyPage("success", locale), 200);
  } catch (err) {
    console.error("[verify] confirmation failed:", err);
    return invalid(locale);
  }
}
