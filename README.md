# Little World

A calm, structured storytelling app for children with autism. Built with a monorepo architecture using npm workspaces.

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| **Mobile App** | React Native 0.81 + Expo SDK 54 |
| **Admin Web** | Next.js App Router + shadcn/ui (stub) |
| **UI (mobile)** | Tamagui + custom components |
| **State** | Zustand + AsyncStorage |
| **Backend API** | Next.js API Routes |
| **Database** | PostgreSQL (Docker) |
| **Storage** | Supabase Storage |
| **Auth** | Email/Password (JWT tokens) |
| **Navigation** | React Navigation 7 |

---

## Project Structure

```
calm-stories/
├── apps/
│   ├── api/                  # Next.js backend API
│   │   └── src/app/api/      # REST endpoints
│   ├── admin/                # Next.js admin web panel (stub)
│   └── mobile/               # React Native + Expo app
│       └── src/
│           ├── screens/
│           │   ├── child/    # Splash, AgeGate, Privacy, StoryList,
│           │   │             # StoryPlayer, Paywall, ParentGate, Settings, Policy
│           │   ├── admin/    # Dashboard, StoryForm, PageEditor
│           │   └── auth/     # Login
│           ├── components/   # Btn, Card, CheckRow, ScreenHeader, Toggle, Segment
│           ├── store/        # Zustand stores (appStore, authStore, storyStore)
│           ├── services/     # API client
│           ├── navigation/   # React Navigation setup
│           └── theme/        # Tamagui config
├── packages/
│   ├── shared/               # Types, constants, themes
│   │   └── src/
│   │       ├── themes.ts     # 4 color themes (calm-green, soft-blue, warm-peach, high-contrast)
│   │       ├── constants.ts  # App constants, difficulty levels
│   │       └── index.ts      # Barrel exports
│   └── db/                   # DB connection, migrations & seed
│       └── src/
│           └── seed.ts       # 10 stories across 3 difficulty levels
├── docker-compose.yml        # PostgreSQL container
├── package.json              # Workspace config
└── .env.example              # Environment template
```

---

## Quick Start

### Prerequisites

- **Node.js** >= 18
- **npm** >= 8 (included with Node.js)
- **Docker** & Docker Compose
- **Expo CLI** (`npm install -g expo-cli`)

### 1. Clone & Install

```bash
git clone <your-repo-url> calm-stories
cd calm-stories
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your database and Supabase keys
```

### 3. One-Command Setup

Starts the database, runs migrations, and seeds demo data:

```bash
npm run setup
```

Or step by step:

```bash
# Start PostgreSQL in Docker
npm run docker:up

# Wait a few seconds, then run migrations
npm run db:migrate

# Seed demo data (creates admin user + 10 stories)
npm run db:seed
```

### 4. Run Development Servers

**Run everything at once:**
```bash
npm run dev
```

**Or separately:**

```bash
# Terminal 1 - Backend API (http://localhost:3000)
npm run dev:api

# Terminal 2 - Mobile app (Expo dev server)
npm run dev:mobile

# Terminal 3 - Admin web panel (http://localhost:3001) (stub)
npm run dev:admin
```

---

## Database

### Re-seeding

The seed script clears all existing data and re-inserts fresh content. Safe to re-run anytime:

```bash
npm run db:seed
```

This creates:
- 1 admin user
- 10 stories across 3 difficulty levels:
  - **Beginner** (3 free): The Happy Morning, My Big Feelings, Brushing My Teeth
  - **Medium** (3 free + 1 premium): Learning to Share, Going to the Store, Waiting My Turn, First Day of School
  - **Advanced** (1 free + 2 premium): Saying Hello, Making a Friend, When Things Change

### Full Database Reset

To wipe everything and start fresh (schema + data):

```bash
npm run docker:reset
# Wait a few seconds
npm run db:migrate
npm run db:seed
```

### Docker Commands

| Command | What it does |
|---------|-------------|
| `npm run docker:up` | Start PostgreSQL container |
| `npm run docker:down` | Stop PostgreSQL container |
| `npm run docker:reset` | Destroy data & restart fresh |

---

## Run Commands Summary

| Command | Description |
|---------|-------------|
| `npm run dev` | Run API + Mobile together |
| `npm run dev:api` | Run backend only (port 3000) |
| `npm run dev:mobile` | Run Expo mobile only |
| `npm run dev:admin` | Run admin web panel (port 3001) |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed demo data (re-runnable) |
| `npm run setup` | Full setup (install + docker + migrate + seed) |
| `npm run docker:up` | Start PostgreSQL |
| `npm run docker:down` | Stop PostgreSQL |
| `npm run docker:reset` | Reset database completely |
| `npm run build:api` | Build API for production |
| `npm run build:shared` | Build shared package |
| `npm run clean` | Remove all node_modules |

---

## Default Admin Login

After running `npm run db:seed`:

```
Email:    admin@littleworld.app
Password: admin123
```

You can access the admin login from the mobile app via **Settings > Admin Panel** (below the version number).

---

## App Screens

### Child Mode (no login required)

| Screen | Description |
|--------|-------------|
| **Splash** | Animated logo + progress bar |
| **Age Gate** | Child under 13 / 13+ selection (COPPA) |
| **Privacy** | Privacy promises + agree to continue |
| **Story List** | Stories grouped by difficulty (beginner/medium/advanced) with SectionList |
| **Story Player** | Page-by-page reading with gradient art, audio button, dot pagination |
| **Paywall** | Premium story upsell ($2.99/month) |
| **Parent Gate** | Email verification for grown-up consent |
| **Settings** | Theme picker (4 themes), audio, text size, animations, about links |
| **Privacy Policy** | Full policy text |

### Admin Mode (after login)

| Screen | Description |
|--------|-------------|
| **Dashboard** | Story list with CRUD, publish/unpublish |
| **Story Form** | Create or edit story details |
| **Page Editor** | Add, edit, delete, and reorder pages |

---

## Themes

4 built-in themes selectable from Settings:

| Theme | Style |
|-------|-------|
| **Calm Green** | Default soft green palette |
| **Soft Blue** | Cool blue tones |
| **Warm Peach** | Warm orange/peach tones |
| **High Contrast** | Dark background, high contrast (accessibility) |

---

## Story Difficulty Levels

Stories are categorized into 3 levels with distinct visual styling:

| Level | Gradient | Dot Color | Description |
|-------|----------|-----------|-------------|
| **Beginner** | Warm orange | #FFB347 | Simple sentences, daily routines |
| **Medium** | Cool blue | #7FA8D8 | Social stories, multi-step sequences |
| **Advanced** | Soft purple | #9982D4 | Complex social situations, emotional regulation |

---

## API Endpoints

### Auth
- `POST /api/auth/login` - Login (returns JWT)
- `POST /api/auth/register` - Register new user (admin only)

### Stories
- `GET /api/stories` - List all published stories
- `POST /api/stories` - Create story (auth required)
- `GET /api/stories/:id` - Get story with pages
- `PUT /api/stories/:id` - Update story (auth required)
- `DELETE /api/stories/:id` - Delete story (auth required)

### Pages
- `GET /api/stories/:id/pages` - List pages
- `POST /api/stories/:id/pages` - Add page (auth required)
- `PUT /api/stories/:id/pages/:pageId` - Update page (auth required)
- `DELETE /api/stories/:id/pages/:pageId` - Delete page (auth required)
- `PUT /api/stories/:id/pages/reorder` - Reorder pages (auth required)

### Upload
- `POST /api/upload` - Upload image/audio (auth required)

---

## Performance

- **Story list caching**: the mobile app persists the story list (Zustand `persist` middleware backed by AsyncStorage, key `@littleworld/stories`). On app open, cached stories render immediately with no loading spinner; a background refresh then updates the store silently. If the API is unreachable (offline), the cached list keeps showing without an error.
- **5-minute refresh window**: the store tracks a `lastFetched` timestamp and skips the API call entirely while the cache is younger than 5 minutes. Level-filtered fetches (admin) always go to the API and are never cached.
- **Image caching** (`expo-image`): full-page story illustrations in the player use `cachePolicy="disk"`; story list thumbnails use `cachePolicy="memory-disk"` so they appear instantly on revisit. Both fade in with a 200 ms transition.

---

## Design Principles

- COPPA-compliant (age gate, parental consent, no tracking)
- 48dp minimum touch targets
- 4.5:1 contrast ratio
- No flashing or sudden animations
- Soft, calming color palettes
- Repetition and predictability
- Positive reinforcement only
- `prefers-reduced-motion` respected
- No external links in child mode
