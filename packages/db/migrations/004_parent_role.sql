-- ═══════════════════════════════════════════════
-- Parent role — public self-registration
-- ═══════════════════════════════════════════════

-- Parents can create their own accounts from the app; admin/editor stay
-- invite-only. New self-registered accounts default to 'parent'.
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'parent';
ALTER TABLE users DROP CONSTRAINT users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin', 'editor', 'parent'));
