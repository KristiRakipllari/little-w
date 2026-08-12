import { NextRequest } from "next/server";
import { queryOne } from "@calm-stories/db";
import { hashPassword, verifyPassword, isLegacyHash, signToken } from "@/app/lib/auth";
import { rateLimit, clearRateLimit } from "@/app/lib/rateLimit";
import { parseConsent, hasConsent } from "@/app/lib/consent";
import { success, error, serverError } from "@/app/lib/response";
import type { User, LoginRequest } from "@calm-stories/shared";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(req: NextRequest) {
  try {
    const body: LoginRequest = await req.json();

    if (!body.email || !body.password) {
      return error("Email and password are required");
    }

    // Brute-force guard: 5 attempts per email+IP per window; a successful
    // login clears the bucket so real users are never locked out for long.
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const limitKey = `login:${ip}:${body.email.toLowerCase()}`;
    if (!rateLimit(limitKey, MAX_ATTEMPTS, WINDOW_MS)) {
      return error("Too many attempts. Please try again later.", 429);
    }

    const user = await queryOne<User & { password_hash: string }>(
      "SELECT * FROM users WHERE email = $1",
      [body.email.toLowerCase()]
    );

    if (!user || !(await verifyPassword(body.password, user.password_hash))) {
      return error("Invalid email or password", 401);
    }

    clearRateLimit(limitKey);

    // Migrate-on-login: silently upgrade pre-bcrypt (SHA-256) hashes now
    // that we hold the verified plaintext. Users notice nothing.
    if (isLegacyHash(user.password_hash)) {
      const upgraded = await hashPassword(body.password);
      await queryOne("UPDATE users SET password_hash = $1 WHERE id = $2", [
        upgraded,
        user.id,
      ]);
    }

    // The free week is the account's first 7 days (the lifetime of its first
    // JWT). Persisting consumption here makes it survive reinstalls and
    // cleared app data — the client re-learns it on every login.
    if (!user.trial_used) {
      const consumed = await queryOne<{ trial_used: boolean }>(
        `UPDATE users SET trial_used = true
         WHERE id = $1 AND created_at + INTERVAL '7 days' < NOW()
         RETURNING trial_used`,
        [user.id]
      );
      if (consumed) user.trial_used = true;
    }

    // Backfill consent for accounts created before it was captured. Written
    // only while the columns are still null — the first record captured is the
    // one with evidentiary value, so a later login never overwrites it.
    // Failure here must never fail the login.
    const consent = parseConsent(body.consent);
    if (hasConsent(consent)) {
      try {
        const filled = await queryOne<{ consent_version: number | null }>(
          `UPDATE users
           SET consent_version = $1,
               consent_accepted_at = $2,
               consent_guardian_confirmed = $3
           WHERE id = $4 AND consent_version IS NULL
           RETURNING consent_version`,
          [consent.version, consent.accepted_at, consent.guardian_confirmed, user.id]
        );
        if (filled) {
          user.consent_version = consent.version;
          user.consent_accepted_at = consent.accepted_at?.toISOString() ?? null;
          user.consent_guardian_confirmed = consent.guardian_confirmed;
        }
      } catch (err) {
        console.error("[login] consent backfill failed:", err);
      }
    }

    const { password_hash, ...safeUser } = user;
    const token = signToken(safeUser as User);

    return success({
      access_token: token,
      user: safeUser,
    });
  } catch (err) {
    return serverError(err);
  }
}
