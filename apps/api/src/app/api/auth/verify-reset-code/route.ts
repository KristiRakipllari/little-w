import { NextRequest } from "next/server";
import { query, queryOne } from "@calm-stories/db";
import { verifyPassword } from "@/app/lib/auth";
import { rateLimit } from "@/app/lib/rateLimit";
import { success, error, serverError } from "@/app/lib/response";
import type { VerifyResetCodeRequest } from "@calm-stories/shared";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const MAX_CODE_TRIES = 5;

const GENERIC_FAIL = "That code is invalid or has expired. Please request a new one.";

// POST /api/auth/verify-reset-code — check a reset code WITHOUT consuming it,
// so the app can advance to the new-password step only once the code is
// confirmed. The code is burned later by /reset-password. Wrong guesses still
// count toward the same attempt cap, so this is not a brute-force bypass.
export async function POST(req: NextRequest) {
  try {
    const body: VerifyResetCodeRequest = await req.json();

    if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return error("Please enter a valid email address");
    }
    if (!body.code || !/^\d{6}$/.test(body.code)) {
      return error("Enter the 6-digit code from your email");
    }

    const email = body.email.toLowerCase();
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!rateLimit(`verify:${ip}:${email}`, MAX_ATTEMPTS, WINDOW_MS)) {
      return error("Too many attempts. Please try again later.", 429);
    }

    const user = await queryOne<{ id: string }>(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );
    if (!user) return error(GENERIC_FAIL, 400);

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

    return success({ valid: true });
  } catch (err) {
    return serverError(err);
  }
}
