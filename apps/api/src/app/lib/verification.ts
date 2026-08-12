import crypto from "crypto";
import { query } from "@calm-stories/db";
import { sendEmail } from "@/app/lib/email";
import { APP_NAME, API_ENDPOINTS } from "@calm-stories/shared";
import type { SupportedLocale } from "@calm-stories/shared";

// Base URL the emailed link points at. Must be reachable from wherever the
// parent opens their mail — not from the server.
const APP_PUBLIC_URL =
  process.env.APP_PUBLIC_URL || process.env.API_URL || "http://localhost:3000";

// Verification links are opened on someone else's device. A localhost URL is
// dead on arrival, and that failure appears only in a user's inbox — never in
// our logs. Fail fast, same as JWT_SECRET.
//
// Skipped during `next build` for the same reason as the SMTP guard in
// email.ts: the build runs with NODE_ENV=production but no deployment env.
if (
  process.env.NODE_ENV === "production" &&
  process.env.NEXT_PHASE !== "phase-production-build"
) {
  if (!process.env.APP_PUBLIC_URL && !process.env.API_URL) {
    throw new Error("APP_PUBLIC_URL must be set in production");
  }
  if (/localhost|127\.0\.0\.1|0\.0\.0\.0/.test(APP_PUBLIC_URL)) {
    throw new Error(
      "Refusing to start: APP_PUBLIC_URL points at localhost, so emailed verification links would be unreachable."
    );
  }
}

// A link is read whenever the parent next opens their mail — often the next
// morning, often on another device. The 15 minutes that suits a typed 6-digit
// code would send most users straight to "resend".
export const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

// Rows kept this long past expiry, then swept opportunistically on resend.
const SWEEP_AFTER_DAYS = 7;

/** 256 bits, base64url — only [A-Za-z0-9_-], so it survives email clients. */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/**
 * SHA-256 hex, deliberately NOT bcrypt.
 *
 * The link carries no email, so the row must be found BY the token. bcrypt
 * salts per row, which makes an indexed `WHERE token_hash = $1` impossible and
 * would force a bcrypt compare against every outstanding row — O(n) slow
 * hashes per click, and a trivial DoS. bcrypt's cost exists to protect
 * low-entropy secrets (the 6-digit reset code needs it); a 256-bit
 * uniform-random token has no dictionary to attack, so there is nothing for
 * the slowness to buy.
 */
export function hashVerificationToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Shape guard for anything arriving from a query string or form body. This is
 * the XSS boundary for the HTML pages: only base64url characters can ever
 * reach the markup.
 */
export function isWellFormedToken(token: string): boolean {
  return /^[A-Za-z0-9_-]{20,64}$/.test(token);
}

/**
 * Issues a fresh token, invalidating any earlier ones for this user (a new
 * link must make the old one dead). Returns the plaintext to email; only the
 * hash is stored.
 */
export async function issueVerificationToken(userId: string): Promise<string> {
  const token = generateVerificationToken();
  const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MS);

  await query("DELETE FROM email_verification_tokens WHERE user_id = $1", [
    userId,
  ]);
  await query(
    `INSERT INTO email_verification_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, hashVerificationToken(token), expiresAt]
  );

  return token;
}

/** Opportunistic cleanup — there is no cron in this project. */
export async function sweepExpiredTokens(): Promise<void> {
  await query(
    `DELETE FROM email_verification_tokens
     WHERE expires_at < NOW() - INTERVAL '${SWEEP_AFTER_DAYS} days'`
  );
}

export function buildVerificationLink(
  token: string,
  locale: SupportedLocale
): string {
  const base = APP_PUBLIC_URL.replace(/\/+$/, "");
  return `${base}${API_ENDPOINTS.AUTH.VERIFY_EMAIL}?token=${encodeURIComponent(
    token
  )}&lang=${locale}`;
}

const EMAIL_COPY: Record<SupportedLocale, { subject: string; body: (link: string) => string }> = {
  en: {
    subject: `Confirm your ${APP_NAME} email`,
    body: (link) =>
      `Welcome to ${APP_NAME}.\n\n` +
      `Please confirm this email address so you can recover your account and subscription later:\n\n` +
      `${link}\n\n` +
      `The link works once and expires in 24 hours. If you didn't create an account, you can ignore this email.`,
  },
  sq: {
    subject: `Konfirmo emailin tënd në ${APP_NAME}`,
    body: (link) =>
      `Mirë se vini në ${APP_NAME}.\n\n` +
      `Ju lutemi konfirmoni këtë adresë emaili që të mund të rikuperoni llogarinë dhe abonimin më vonë:\n\n` +
      `${link}\n\n` +
      `Lidhja funksionon vetëm një herë dhe skadon pas 24 orësh. Nëse nuk keni krijuar llogari, mund ta shpërfillni këtë email.`,
  },
};

export async function sendVerificationEmail(
  email: string,
  token: string,
  locale: SupportedLocale
): Promise<void> {
  const copy = EMAIL_COPY[locale] ?? EMAIL_COPY.en;
  await sendEmail({
    to: email,
    subject: copy.subject,
    text: copy.body(buildVerificationLink(token, locale)),
  });
}
