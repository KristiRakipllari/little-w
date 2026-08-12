import type { ConsentRecord } from "@calm-stories/shared";

export interface ParsedConsent {
  version: number | null;
  accepted_at: Date | null;
  guardian_confirmed: boolean | null;
}

const EMPTY: ParsedConsent = {
  version: null,
  accepted_at: null,
  guardian_confirmed: null,
};

/**
 * Coerces the consent snapshot a client sends at register/login.
 *
 * This is entirely client-supplied and entirely optional: older app builds
 * omit it, and a malformed object must never fail a registration or a login.
 * Anything unparseable degrades to nulls rather than throwing — the columns
 * are nullable precisely so that a missing record is a normal state.
 *
 * Note what this is and isn't: a record of what the device reported, not
 * independent proof of consent.
 */
export function parseConsent(raw: ConsentRecord | undefined): ParsedConsent {
  if (!raw || typeof raw !== "object") return EMPTY;

  const version = Number.isInteger(raw.version) ? raw.version : null;

  let acceptedAt: Date | null = null;
  if (typeof raw.accepted_at === "string") {
    const parsed = new Date(raw.accepted_at);
    if (!Number.isNaN(parsed.getTime())) acceptedAt = parsed;
  }

  const guardianConfirmed =
    typeof raw.guardian_confirmed === "boolean" ? raw.guardian_confirmed : null;

  return {
    version,
    accepted_at: acceptedAt,
    guardian_confirmed: guardianConfirmed,
  };
}

/** True when there is anything worth writing. */
export function hasConsent(consent: ParsedConsent): boolean {
  return consent.version !== null || consent.accepted_at !== null;
}
