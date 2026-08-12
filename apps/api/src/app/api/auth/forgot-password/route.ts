import { NextRequest } from "next/server";
import crypto from "crypto";
import { query, queryOne } from "@calm-stories/db";
import { hashPassword } from "@/app/lib/auth";
import { rateLimit } from "@/app/lib/rateLimit";
import { sendEmail } from "@/app/lib/email";
import { success, error, serverError } from "@/app/lib/response";
import { APP_NAME } from "@calm-stories/shared";
import type { ForgotPasswordRequest } from "@calm-stories/shared";

const MAX_ATTEMPTS = 3;
const WINDOW_MS = 15 * 60 * 1000;
const CODE_TTL_MS = 15 * 60 * 1000;

// Cryptographically-random 6-digit code (000000–999999).
function generateCode(): string {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

// POST /api/auth/forgot-password — email a single-use reset code.
// Always returns the same generic success so the response can't be used to
// probe which emails have accounts.
export async function POST(req: NextRequest) {
  try {
    const body: ForgotPasswordRequest = await req.json();

    if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return error("Please enter a valid email address");
    }

    const email = body.email.toLowerCase();
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!rateLimit(`forgot:${ip}:${email}`, MAX_ATTEMPTS, WINDOW_MS)) {
      return error("Too many attempts. Please try again later.", 429);
    }

    const user = await queryOne<{ id: string }>(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    // Only do the work when the account exists — but the response is identical
    // either way (no account-existence leak).
    if (user) {
      const code = generateCode();
      const codeHash = await hashPassword(code);
      const expiresAt = new Date(Date.now() + CODE_TTL_MS);

      // A fresh request invalidates any earlier outstanding codes.
      await query("DELETE FROM password_reset_codes WHERE user_id = $1", [user.id]);
      await query(
        `INSERT INTO password_reset_codes (user_id, code_hash, expires_at)
         VALUES ($1, $2, $3)`,
        [user.id, codeHash, expiresAt]
      );

      await sendEmail({
        to: email,
        subject: `${APP_NAME} password reset code`,
        text:
          `Your ${APP_NAME} password reset code is ${code}.\n\n` +
          `It expires in 15 minutes. If you didn't request this, you can ignore this email.`,
      });
    }

    return success({
      message: "If an account exists for that email, a reset code is on its way.",
    });
  } catch (err) {
    return serverError(err);
  }
}
