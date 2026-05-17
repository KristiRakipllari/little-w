-- ═══════════════════════════════════════════════
-- Migration 002 — Add bilingual support (SQ + EN)
-- ═══════════════════════════════════════════════

-- ─── Story pages: add per-language text and audio ──

ALTER TABLE story_pages ADD COLUMN text_sq TEXT NOT NULL DEFAULT '';
ALTER TABLE story_pages ADD COLUMN text_en TEXT NOT NULL DEFAULT '';
ALTER TABLE story_pages ADD COLUMN audio_path_sq TEXT;
ALTER TABLE story_pages ADD COLUMN audio_path_en TEXT;

-- Migrate existing single-language data into both columns
UPDATE story_pages SET text_en = text, text_sq = text;

-- Drop old single-language columns
ALTER TABLE story_pages DROP COLUMN text;
ALTER TABLE story_pages DROP COLUMN audio_url;
