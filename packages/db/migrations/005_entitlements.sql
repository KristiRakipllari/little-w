-- ═══════════════════════════════════════════════
-- Server-side entitlements — premium becomes enforceable
-- ═══════════════════════════════════════════════

-- Kept in sync by the RevenueCat webhook (POST /api/webhooks/revenuecat).
-- Access rule: entitlement IS NOT NULL AND (expires_at IS NULL OR expires_at > NOW()).
-- Expiry is stored rather than a boolean so a missed webhook can only ever
-- cut access short, never extend it.
ALTER TABLE users
  ADD COLUMN entitlement VARCHAR(100),
  ADD COLUMN entitlement_expires_at TIMESTAMP,
  ADD COLUMN entitlement_store VARCHAR(32);
