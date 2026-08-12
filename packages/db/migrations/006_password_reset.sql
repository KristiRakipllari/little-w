-- ═══════════════════════════════════════════════
-- Password reset — 6-digit codes (hashed, single-use)
-- ═══════════════════════════════════════════════
--
-- Backs POST /api/auth/forgot-password and /api/auth/reset-password.
-- Only a bcrypt hash of the code is stored (never the plaintext code),
-- codes expire after 15 minutes, are single-use (used_at), and cap failed
-- attempts. A new request for a user deletes their prior codes.
--
-- Manual reverse:
--   DROP TABLE IF EXISTS password_reset_codes;

CREATE TABLE IF NOT EXISTS password_reset_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reset_codes_user ON password_reset_codes(user_id);
