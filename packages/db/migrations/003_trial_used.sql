-- ═══════════════════════════════════════════════
-- Trial tracking — one free week per account
-- ═══════════════════════════════════════════════

ALTER TABLE users ADD COLUMN trial_used BOOLEAN NOT NULL DEFAULT false;

-- Accounts older than the 7-day free window have already consumed it.
UPDATE users SET trial_used = true WHERE created_at + INTERVAL '7 days' < NOW();
