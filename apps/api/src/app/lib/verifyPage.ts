import { APP_NAME, COLORS, SUPPORTED_LOCALES, API_ENDPOINTS } from "@calm-stories/shared";
import type { SupportedLocale } from "@calm-stories/shared";

// A human clicks this link in an email client, so these routes answer with
// HTML rather than the JSON helpers in response.ts. That is the only
// deliberate deviation from the shared response shape in the codebase.

export type VerifyPageState = "confirm" | "success" | "invalid";

const c = COLORS.child;

interface Copy {
  title: string;
  body: string;
  button?: string;
}

const COPY: Record<SupportedLocale, Record<VerifyPageState, Copy>> = {
  en: {
    confirm: {
      title: "Confirm your email",
      body: `Tap the button below to confirm this address for your ${APP_NAME} account.`,
      button: "Confirm my email",
    },
    success: {
      title: "Email confirmed",
      body: `Thank you. You can close this page and return to the ${APP_NAME} app.`,
    },
    invalid: {
      title: "This link is no longer valid",
      body: `Verification links expire after 24 hours and can only be used once. Open the ${APP_NAME} app, go to the grown-up area, and tap "Resend verification email".`,
    },
  },
  sq: {
    confirm: {
      title: "Konfirmo emailin",
      body: `Shtyp butonin më poshtë për të konfirmuar këtë adresë për llogarinë tuaj në ${APP_NAME}.`,
      button: "Konfirmo emailin tim",
    },
    success: {
      title: "Emaili u konfirmua",
      body: `Faleminderit. Mund ta mbyllni këtë faqe dhe të ktheheni te aplikacioni ${APP_NAME}.`,
    },
    invalid: {
      title: "Kjo lidhje nuk është më e vlefshme",
      body: `Lidhjet e verifikimit skadojnë pas 24 orësh dhe mund të përdoren vetëm një herë. Hapni aplikacionin ${APP_NAME}, shkoni te zona e të rriturve dhe shtypni "Ridërgo emailin e verifikimit".`,
    },
  },
};

/** Query-string locales are untrusted — allowlist before rendering. */
export function parseLocale(raw: string | null): SupportedLocale {
  const found = SUPPORTED_LOCALES.find((l) => l === raw);
  return found ?? "en";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * `token` is only used for the confirm state's hidden field, and callers must
 * have passed it through isWellFormedToken() first. It is escaped here anyway.
 *
 * The page deliberately carries NO external assets — a stylesheet, font or
 * image would leak the full token to a third party via the Referer header.
 * The email address is never rendered, so a leaked link discloses nothing.
 */
export function renderVerifyPage(
  state: VerifyPageState,
  locale: SupportedLocale,
  token?: string
): string {
  const copy = COPY[locale][state];
  const form =
    state === "confirm" && token
      ? `<form method="POST" action="${API_ENDPOINTS.AUTH.VERIFY_EMAIL}">
      <input type="hidden" name="token" value="${escapeHtml(token)}">
      <button type="submit">${escapeHtml(copy.button ?? "")}</button>
    </form>`
      : "";

  return `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="referrer" content="no-referrer">
<meta name="robots" content="noindex, nofollow">
<title>${escapeHtml(copy.title)} · ${APP_NAME}</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
       padding:24px;background:${c.background};color:${c.text};
       font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
  main{background:${c.surface};border:1px solid ${c.border};border-radius:24px;
       padding:40px 32px;max-width:420px;width:100%;text-align:center}
  h1{margin:0 0 12px;font-size:24px;line-height:1.25;letter-spacing:-0.4px}
  p{margin:0;font-size:16px;line-height:1.5;color:${c.textLight}}
  button{margin-top:28px;width:100%;min-height:56px;border:0;border-radius:14px;
         background:${c.primary};color:#fff;font-size:17px;font-weight:700;cursor:pointer}
  button:hover{opacity:.9}
  .brand{margin-top:28px;font-size:13px;font-weight:600;color:${c.textLight}}
</style>
</head>
<body>
  <main>
    <h1>${escapeHtml(copy.title)}</h1>
    <p>${escapeHtml(copy.body)}</p>
    ${form}
    <div class="brand">${APP_NAME}</div>
  </main>
</body>
</html>`;
}

export function htmlResponse(html: string, status: number): Response {
  return new Response(html, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Keep the token out of shared proxy caches and the bfcache.
      "Cache-Control": "no-store",
    },
  });
}
