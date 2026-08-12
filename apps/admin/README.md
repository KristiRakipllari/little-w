# Little World — Admin Panel

Standalone Next.js web app for managing Little World content: stories, pages, publishing, and image uploads. Staff-only — parents and children never see this app; the mobile app has no admin surface.

## Tech

- Next.js 15 (App Router) + React 19, Tailwind CSS v4, shadcn/ui
- Drag-and-drop page reordering via dnd-kit
- Cookie-session auth: the browser never sees the API JWT. Login goes through a BFF proxy route that stores the token in an httpOnly cookie; middleware guards all dashboard routes.

## Setup

1. Copy the env template and adjust if needed:

   ```bash
   cp .env.local.example .env.local
   ```

   | Variable | Meaning | Local default |
   |----------|---------|---------------|
   | `NEXT_PUBLIC_API_URL` | Base URL of the Little World API (`apps/api`) | `http://localhost:3000` |
   | `SESSION_COOKIE_NAME` | Name of the httpOnly session cookie | `lw_session` |

2. Make sure the API and database are running (from the repo root):

   ```bash
   npm run docker:up && npm run dev:api
   ```

3. Start the admin app (from the repo root):

   ```bash
   npm run dev:admin
   # → http://localhost:3001/login
   ```

   Log in with the seeded admin account: `admin@littleworld.app` / `admin123` (created by `npm run db:seed`).

## Scripts

Run from the repo root with `-w @calm-stories/admin`, or from this directory:

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server on port 3001 |
| `npm run build` | Production build |
| `npm run start` | Serve the production build on port 3001 |
| `npm run typecheck` | `tsc --noEmit` |

## Deploying (Vercel)

Deploy `apps/admin` as its own site, separate from the API:

- Set the project root to `apps/admin` (monorepo setting).
- Set `NEXT_PUBLIC_API_URL` to the deployed API's URL (and `SESSION_COOKIE_NAME` if you want a non-default cookie name).
- The session cookie is httpOnly and scoped to the admin domain; no other configuration is needed.

## Uploads

`POST /api/upload` accepts images (`png`/`jpeg`/`webp`, max 5MB) and audio (`mp3`/`m4a` — `audio/mpeg`, `audio/mp4`, max 20MB). Files land in Supabase Storage under `stories/{storyId}/{type}_{timestamp}.{ext}`, and the full public URL is stored on the record.

The Page Editor uploads both: page artwork, and one narration track per language (persisted to `audio_path_sq` / `audio_path_en`). Deleting a page also removes its image and audio from storage; replacing a file leaves the previous one behind.

The Supabase bucket enforces its own allowed-MIME list and size cap independently of the API, so the two must agree. `npm run storage:config` (from the repo root) applies the correct settings to the bucket and is safe to re-run — run it after changing the limits in `apps/api/src/app/api/upload/route.ts`, or when setting up a new Supabase project.

## Narration playback

Audio uploaded here plays in the mobile story player: the reader taps "Read aloud" on a page and hears the track for their current language. Pages with no track for that language show no play button — the app never falls back to the other language.
