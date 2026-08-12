import { NextRequest } from "next/server";
import { query, queryOne } from "@calm-stories/db";
import { hashPassword, verifyPassword } from "@/app/lib/auth";
import { rateLimit } from "@/app/lib/rateLimit";
import { success, error, serverError } from "@/app/lib/response";
import type { ResetPasswordRequest } from "@calm-stories/shared";

const MAX_ATTEMPTS = 5; // rate-limit window (requests per email+IP)
const WINDOW_MS = 15 * 60 * 1000;
const MAX_CODE_TRIES = 5; // wrong-code guesses before a code is burned

// A single generic failure — never reveals whether the email, the code, or the
// expiry was the problem (no account-existence or code-state leak).
const GENERIC_FAIL = "That code is invalid or has expired. Please request a new one.";

// POST /api/auth/reset-password — verify a code and set a new password.
export async function POST(req: NextRequest) {
  try {
    const body: ResetPasswordRequest = await req.json();

    if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return error("Please enter a valid email address");
    }
    if (!body.code || !/^\d{6}$/.test(body.code)) {
      return error("Enter the 6-digit code from your email");
    }
    if (!body.password || body.password.length < 8) {
      return error("Password must be at least 8 characters");
    }

    const email = body.email.toLowerCase();
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!rateLimit(`reset:${ip}:${email}`, MAX_ATTEMPTS, WINDOW_MS)) {
      return error("Too many attempts. Please try again later.", 429);
    }

    const user = await queryOne<{ id: string }>(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );
    if (!user) return error(GENERIC_FAIL, 400);

    // Newest still-valid code for this user.
    const record = await queryOne<{ id: string; code_hash: string; attempts: number }>(
      `SELECT id, code_hash, attempts
       FROM password_reset_codes
       WHERE user_id = $1 AND used_at IS NULL AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
      [user.id]
    );
    if (!record || record.attempts >= MAX_CODE_TRIES) {
      return error(GENERIC_FAIL, 400);
    }

    const ok = await verifyPassword(body.code, record.code_hash);
    if (!ok) {
      await query(
        "UPDATE password_reset_codes SET attempts = attempts + 1 WHERE id = $1",
        [record.id]
      );
      return error(GENERIC_FAIL, 400);
    }

    // Success: set the new password and burn the code (single-use).
    const passwordHash = await hashPassword(body.password);
    await query("UPDATE users SET password_hash = $1 WHERE id = $2", [
      passwordHash,
      user.id,
    ]);
    await query(
      "UPDATE password_reset_codes SET used_at = NOW() WHERE id = $1",
      [record.id]
    );

    return success({ message: "Your password has been reset. You can now log in." });
  } catch (err) {
    return serverError(err);
  }
}
