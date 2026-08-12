-- ═══════════════════════════════════════════════
-- Little World — full schema (Supabase / fresh database)
-- ═══════════════════════════════════════════════
--
-- Generated from the live schema after migrations 001–007. This is the
-- consolidated equivalent of running `npm run db:migrate` from scratch —
-- use it to stand up a NEW database (e.g. Supabase) in one paste.
--
-- HOW TO USE (Supabase): open the project → SQL Editor → New query → paste
-- this whole file → Run. Then point the API at it:
--   DATABASE_URL=postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres
-- (Use the "Session"/direct connection string, not the pooler, since the API
-- holds a pg Pool of its own.)
--
-- Two deliberate differences from packages/db/migrations/*.sql, both noted
-- inline below: gen_random_uuid() instead of uuid-ossp, and row level
-- security. Everything else is byte-for-byte what the migrations produce.
--
-- Data is NOT included. For demo content run `npm run db:seed` against the
-- new DATABASE_URL (creates the admin user + 10 stories).

-- ─── UUIDs ──────────────────────────────────
-- The migrations use uuid_generate_v4() from the uuid-ossp extension. Here we
-- use gen_random_uuid(), which is built into Postgres 13+ and needs no
-- extension at all. This avoids a real Supabase trap: uuid-ossp is often
-- already installed in the `extensions` schema, so a
-- `CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public` would
-- silently no-op and then public.uuid_generate_v4() would not resolve.
-- The two functions are interchangeable for our purposes.

-- ─── updated_at trigger ─────────────────────

CREATE OR REPLACE FUNCTION public.update_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ─── users ──────────────────────────────────
-- Parents self-register; admin/editor are invite-only (granted by an admin).
-- email_verified gates only the START of a subscription — never entitlement
-- itself. consent_* is the server-side record of the on-device COPPA consent
-- (nullable: older clients omit it, and it must never fail a registration).

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    role character varying(20) DEFAULT 'parent'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    trial_used boolean DEFAULT false NOT NULL,
    entitlement character varying(100),
    entitlement_expires_at timestamp without time zone,
    entitlement_store character varying(32),
    email_verified boolean DEFAULT false NOT NULL,
    consent_version integer,
    consent_accepted_at timestamp without time zone,
    consent_guardian_confirmed boolean,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_email_key UNIQUE (email),
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'editor'::character varying, 'parent'::character varying])::text[])))
);

CREATE INDEX idx_users_email ON public.users USING btree (email);

CREATE TRIGGER trg_users_updated BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- ─── stories ────────────────────────────────

CREATE TABLE public.stories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(500) NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    cover_image_url text,
    level character varying(20) DEFAULT 'beginner'::character varying NOT NULL,
    is_premium boolean DEFAULT false NOT NULL,
    is_published boolean DEFAULT false NOT NULL,
    created_by uuid,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT stories_pkey PRIMARY KEY (id),
    CONSTRAINT stories_level_check CHECK (((level)::text = ANY ((ARRAY['beginner'::character varying, 'medium'::character varying, 'advanced'::character varying])::text[]))),
    CONSTRAINT stories_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_stories_level ON public.stories USING btree (level);
CREATE INDEX idx_stories_published ON public.stories USING btree (is_published);

CREATE TRIGGER trg_stories_updated BEFORE UPDATE ON public.stories
    FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- ─── story_pages ────────────────────────────
-- UNIQUE(story_id, page_number) is what makes the reorder endpoint's
-- negate-then-renumber dance necessary — a single renumbering UPDATE can
-- transiently violate it depending on row order.

CREATE TABLE public.story_pages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    story_id uuid NOT NULL,
    page_number integer DEFAULT 1 NOT NULL,
    image_url text,
    text_sq text DEFAULT ''::text NOT NULL,
    text_en text DEFAULT ''::text NOT NULL,
    audio_path_sq text,
    audio_path_en text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT story_pages_pkey PRIMARY KEY (id),
    CONSTRAINT story_pages_story_id_page_number_key UNIQUE (story_id, page_number),
    CONSTRAINT story_pages_story_id_fkey FOREIGN KEY (story_id) REFERENCES public.stories(id) ON DELETE CASCADE
);

CREATE INDEX idx_pages_story ON public.story_pages USING btree (story_id);
CREATE INDEX idx_pages_order ON public.story_pages USING btree (story_id, page_number);

CREATE TRIGGER trg_pages_updated BEFORE UPDATE ON public.story_pages
    FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- ─── password_reset_codes ───────────────────
-- 6-digit codes, bcrypt-hashed at rest, 15-minute TTL, single-use via
-- used_at, capped at 5 wrong guesses. A new request deletes prior codes.

CREATE TABLE public.password_reset_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    code_hash character varying(255) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used_at timestamp without time zone,
    attempts integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT password_reset_codes_pkey PRIMARY KEY (id),
    CONSTRAINT password_reset_codes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_reset_codes_user ON public.password_reset_codes USING btree (user_id);

-- ─── email_verification_tokens ──────────────
-- 256-bit random token stored as SHA-256 hex (NOT bcrypt): the link carries
-- no email, so the row is found BY the token, and bcrypt's per-row salt would
-- make an indexed lookup impossible. 24h TTL, single-use via used_at. No
-- attempts column — nothing is typed, and 256 bits has no dictionary.

CREATE TABLE public.email_verification_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token_hash character(64) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT email_verification_tokens_pkey PRIMARY KEY (id),
    CONSTRAINT email_verification_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_verification_tokens_user ON public.email_verification_tokens USING btree (user_id);
-- Unique: the hash is the lookup key; a collision would verify the wrong account.
CREATE UNIQUE INDEX idx_verification_tokens_hash ON public.email_verification_tokens USING btree (token_hash);

-- ─── migrations ledger ──────────────────────
-- packages/db/src/migrate.ts tracks applied migrations by filename here.

CREATE TABLE public.migrations (
    id serial NOT NULL,
    name character varying(255) NOT NULL,
    executed_at timestamp without time zone DEFAULT now(),
    CONSTRAINT migrations_pkey PRIMARY KEY (id),
    CONSTRAINT migrations_name_key UNIQUE (name)
);

-- Mark 001–007 as already applied. Without this, pointing `npm run db:migrate`
-- at this database would try to re-run them and fail on duplicate columns.
INSERT INTO public.migrations (name) VALUES
    ('001_initial.sql'),
    ('002_i18n_columns.sql'),
    ('003_trial_used.sql'),
    ('004_parent_role.sql'),
    ('005_entitlements.sql'),
    ('006_password_reset.sql'),
    ('007_email_verification.sql')
ON CONFLICT (name) DO NOTHING;

-- ─── Row Level Security ─────────────────────
-- NOT in the migrations — this is Supabase-specific and important.
--
-- Supabase auto-exposes every table in `public` through PostgREST. With RLS
-- off, anyone holding the anon key could read and write these tables
-- directly, including users.password_hash, reset codes and verification
-- tokens. Enabling RLS with NO policies denies all PostgREST access.
--
-- This does not affect the API: it connects as the table owner over a direct
-- Postgres connection, and owners bypass RLS. If you ever intend to query
-- these tables from a client via Supabase's REST/JS SDK, you must write
-- explicit policies first — do not simply disable RLS.

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.migrations ENABLE ROW LEVEL SECURITY;
