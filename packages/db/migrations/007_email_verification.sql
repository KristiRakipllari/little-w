-- ═══════════════════════════════════════════════
-- Email verification (link) + server-side consent record
-- ═══════════════════════════════════════════════
--
-- Backs GET/POST /api/auth/verify and POST /api/auth/resend-verification.
--
-- Why verification exists: it is NOT a security gate. An unverified account
-- grants no server-side privilege — hasActiveEntitlement reads only
-- users.entitlement, which the RevenueCat webhook alone writes. Verification
-- exists so a paying parent has a WORKING address before money changes hands,
-- because the password-reset flow is useless against a typo'd email and the
-- only remedy is manual surgery in this table.
--
-- Tokens: 256-bit random, stored as SHA-256 hex — deliberately NOT bcrypt.
-- The link carries no email, so the row must be found BY the token; bcrypt
-- salts per row, which makes an indexed `WHERE token_hash = $1` impossible and
-- would force a bcrypt compare against every outstanding row. bcrypt's
-- slowness protects low-entropy secrets (the 6-digit reset code genuinely
-- needs it); a 256-bit uniform-random token has no dictionary to attack.
-- 24h TTL (a link is read whenever the parent next opens their mail, often the
-- next morning on another device), single-use via used_at. No attempts column:
-- nothing is typed, and brute-forcing 256 bits is not a threat model — the
-- per-IP rate limit on the verify routes covers scanning. No cleanup job;
-- the resend route sweeps rows expired more than 7 days.
--
-- Consent columns: the COPPA consent captured during onboarding lives only in
-- AsyncStorage on the device, so it is lost on reinstall and tied to no
-- account. These columns give account holders a durable, account-linked
-- record. NULL means "registered before capture, or by a client build that
-- doesn't send it" — registration must never fail over these. The value is
-- client-asserted: it records what the device reported, not independent proof.
-- Anonymous free users are deliberately NOT recorded — identifying them is the
-- opposite of what a COPPA-conscious design wants. One version covers both
-- documents because one checkbox covers both.
--
-- Manual reverse:
--   DROP TABLE IF EXISTS email_verification_tokens;
--   ALTER TABLE users DROP COLUMN email_verified,
--                     DROP COLUMN consent_version,
--                     DROP COLUMN consent_accepted_at,
--                     DROP COLUMN consent_guardian_confirmed;

ALTER TABLE users ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT false;

-- NO grandfathering backfill, deliberately. Existing accounts are exactly the
-- population that may already carry a typo'd address, so marking them verified
-- would permanently exempt the people this feature is for. The prompt is
-- actionable for them (resend-verification issues a token for any account),
-- and nothing is shown before SMTP is configured because the whole UI is gated
-- on verification_enforced. Do not "fix" this by adding an UPDATE.

ALTER TABLE users ADD COLUMN consent_version INTEGER;
ALTER TABLE users ADD COLUMN consent_accepted_at TIMESTAMP;
ALTER TABLE users ADD COLUMN consent_guardian_confirmed BOOLEAN;

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash CHAR(64) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_tokens_user ON email_verification_tokens(user_id);

-- Unique: the token hash is the lookup key, and a collision would let one link
-- verify the wrong account.
CREATE UNIQUE INDEX IF NOT EXISTS idx_verification_tokens_hash ON email_verification_tokens(token_hash);
