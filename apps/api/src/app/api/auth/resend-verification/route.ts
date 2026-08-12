import { NextRequest } from "next/server";
import { queryOne } from "@calm-stories/db";
import { rateLimit } from "@/app/lib/rateLimit";
import {
  issueVerificationToken,
  sendVerificationEmail,
  sweepExpiredTokens,
} from "@/app/lib/verification";
import { success, error, serverError } from "@/app/lib/response";
import { SUPPORTED_LOCALES } from "@calm-stories/shared";
import type { ResendVerificationRequest, SupportedLocale } from "@calm-stories/shared";

const MAX_ATTEMPTS = 3;
const WINDOW_MS = 15 * 60 * 1000;

// POST /api/auth/resend-verification — email a fresh verification link.
// Mirrors forgot-password: the response is identical whether or not the
// account exists, and whether or not it is already verified, so it can't be
// used to probe either.
export async function POST(req: NextRequest) {
  try {
    const body: ResendVerificationRequest = await req.json();

    if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return error("Please enter a valid email address");
    }

    const email = body.email.toLowerCase();
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!rateLimit(`resendVerify:${ip}:${email}`, MAX_ATTEMPTS, WINDOW_MS)) {
      return error("Too many attempts. Please try again later.", 429);
    }

    const locale: SupportedLocale = SUPPORTED_LOCALES.find((l) => l === body.locale) ?? "en";

    const user = await queryOne<{ id: string; email_verified: boolean }>(
      "SELECT id, email_verified FROM users WHERE email = $1",
      [email]
    );

    // Work happens only for a real, still-unverified account; the response is
    // the same either way.
    if (user && !user.email_verified) {
      const token = await issueVerificationToken(user.id);
      await sendVerificationEmail(email, token, locale);
    }

    // No cron in this project — piggyback the cleanup on a rate-limited route.
    // Failure here must not affect the user-visible outcome.
    try {
      await sweepExpiredTokens();
    } catch (err) {
      console.error("[resend-verification] token sweep failed:", err);
    }

    return success({
      message: "If an account needs verification, an email is on its way.",
    });
  } catch (err) {
    return serverError(err);
  }
}
