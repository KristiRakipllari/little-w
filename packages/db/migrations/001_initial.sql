-- ═══════════════════════════════════════════════
-- Calm Stories — Initial Migration
-- ═══════════════════════════════════════════════

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Migrations tracking ─────────────────────
CREATE TABLE IF NOT EXISTS migrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  executed_at TIMESTAMP DEFAULT NOW()
);

-- ─── Users (admin/editor) ────────────────────
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'editor' CHECK (role IN ('admin', 'editor')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- ─── Stories ─────────────────────────────────
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  cover_image_url TEXT,
  level VARCHAR(20) NOT NULL DEFAULT 'beginner' CHECK (level IN ('beginner', 'medium', 'advanced')),
  is_premium BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_stories_level ON stories(level);
CREATE INDEX idx_stories_published ON stories(is_published);

-- ─── Story Pages ─────────────────────────────
CREATE TABLE story_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL DEFAULT 1,
  image_url TEXT,
  text TEXT NOT NULL DEFAULT '',
  audio_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(story_id, page_number)
);

CREATE INDEX idx_pages_story ON story_pages(story_id);
CREATE INDEX idx_pages_order ON story_pages(story_id, page_number);

-- ─── Updated at trigger ──────────────────────
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_stories_updated
  BEFORE UPDATE ON stories
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_pages_updated
  BEFORE UPDATE ON story_pages
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();
