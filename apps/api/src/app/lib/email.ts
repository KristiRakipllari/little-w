import nodemailer from "nodemailer";

// Pluggable email sender. When SMTP is configured (SMTP_HOST set), mail goes
// out through nodemailer — this speaks plain SMTP, so any provider works
// (Gmail App Password, Brevo, Mailtrap, Resend-via-SMTP, …). When it is NOT
// configured, we log the message to the server console instead, so the reset
// flow is fully testable in dev without signing up for anything.
//
// This mirrors how the rest of the app degrades gracefully (purchases no-op on
// unsupported platforms; the RevenueCat webhook refuses to run unconfigured).

interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM =
  process.env.SMTP_FROM || SMTP_USER || "Little World <no-reply@littleworld.app>";

// A sandbox transport accepts every message and delivers none of them. In
// production that is indistinguishable from working — mail "sends", nobody
// receives it, and because email verification is enforced whenever SMTP is
// configured, no parent could ever verify or subscribe. The failure would
// surface only as silence. Fail fast instead, same as JWT_SECRET.
//
// Skipped during `next build`: the build runs with NODE_ENV=production but
// has no deployment env, so enforcing here would block anyone building
// without SMTP credentials. The check still runs when the built server
// actually loads this module.
if (
  process.env.NODE_ENV === "production" &&
  process.env.NEXT_PHASE !== "phase-production-build"
) {
  if (!SMTP_HOST) {
    throw new Error("SMTP_HOST must be set in production");
  }
  if (/sandbox/i.test(SMTP_HOST)) {
    throw new Error(
      "Refusing to start: SMTP_HOST is a sandbox/testing host, which delivers no mail. Use a real sending host in production."
    );
  }
}

let transporter: nodemailer.Transporter | null = null;
if (SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // 465 = implicit TLS; 587 = STARTTLS
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
}

/** True when a real SMTP transport is configured (vs. the console stub). */
export function isEmailConfigured(): boolean {
  return transporter !== null;
}

export async function sendEmail(msg: EmailMessage): Promise<void> {
  if (!transporter) {
    // Dev stub: no SMTP configured — print the message so the flow can be
    // exercised end-to-end. Unreachable in production: the boot guard above
    // refuses to start without a real sending host.

    console.log(
      `\n[email:stub] To: ${msg.to}\n[email:stub] Subject: ${msg.subject}\n[email:stub] ${msg.text}\n`
    );
    return;
  }

  await transporter.sendMail({
    from: SMTP_FROM,
    to: msg.to,
    subject: msg.subject,
    text: msg.text,
    html: msg.html,
  });
}
