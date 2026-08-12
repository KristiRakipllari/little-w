import { NextRequest } from "next/server";
import { queryOne } from "@calm-stories/db";
import { hashPassword, signToken, requireAdmin } from "@/app/lib/auth";
import { rateLimit } from "@/app/lib/rateLimit";
import { parseConsent } from "@/app/lib/consent";
import {
  issueVerificationToken,
  sendVerificationEmail,
} from "@/app/lib/verification";
import { created, error, unauthorized, serverError } from "@/app/lib/response";
import { SUPPORTED_LOCALES } from "@calm-stories/shared";
import type {
  User,
  UserRole,
  RegisterRequest,
  SupportedLocale,
} from "@calm-stories/shared";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(req: NextRequest) {
  try {
    // Throttle sign-ups per IP: blunts spam-account creation and the email
    // enumeration the 409 "already registered" response would otherwise allow.
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!rateLimit(`register:${ip}`, MAX_ATTEMPTS, WINDOW_MS)) {
      return error("Too many attempts. Please try again later.", 429);
    }

    const body: RegisterRequest = await req.json();

    if (!body.email || !body.password) {
      return error("Email and password are required");
    }

    // Same shape the mobile parent-gate validation uses.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return error("Please enter a valid email address");
    }

    if (body.password.length < 8) {
      return error("Password must be at least 8 characters");
    }

    // Display name is optional — the email prefix is a sensible default and
    // deriving it here (not in each client) keeps the rule in one place.
    const name = body.name?.trim() || body.email.split("@")[0];

    // Anyone may sign up as a parent. Staff roles (admin/editor) remain
    // invite-only: they can only be granted by an authenticated admin.
    let role: UserRole = "parent";
    if (body.role && body.role !== "parent") {
      try {
        await requireAdmin(req);
        role = body.role;
      } catch {
        return unauthorized("Only admins can create staff accounts");
      }
    }

    // Check if email exists
    const existing = await queryOne(
      "SELECT id FROM users WHERE email = $1",
      [body.email.toLowerCase()]
    );

    if (existing) {
      return error("Email already registered", 409);
    }

    const passwordHash = await hashPassword(body.password);

    // Client-asserted snapshot of the on-device onboarding consent. Optional
    // by design — older builds omit it and the columns are nullable.
    const consent = parseConsent(body.consent);

    const user = await queryOne<User>(
      `INSERT INTO users (email, password_hash, name, role,
                          consent_version, consent_accepted_at, consent_guardian_confirmed)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, name, role, trial_used, email_verified,
                 consent_version, consent_accepted_at, consent_guardian_confirmed,
                 created_at, updated_at`,
      [
        body.email.toLowerCase(),
        passwordHash,
        name,
        role,
        consent.version,
        consent.accepted_at,
        consent.guardian_confirmed,
      ]
    );

    // Verification is a convenience, not a precondition: the account exists
    // and the caller is logged in regardless. A dead SMTP host must never turn
    // a successful registration into a 500 — the user can always resend.
    try {
      const locale: SupportedLocale =
        SUPPORTED_LOCALES.find((l) => l === body.locale) ?? "en";
      const verificationToken = await issueVerificationToken(user!.id);
      await sendVerificationEmail(user!.email, verificationToken, locale);
    } catch (err) {
      console.error("[register] verification email failed:", err);
    }

    const token = signToken(user!);

    return created({
      access_token: token,
      user,
    });
  } catch (err) {
    return serverError(err);
  }
}
