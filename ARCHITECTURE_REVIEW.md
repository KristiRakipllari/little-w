# Architecture Review — Little World

**Reviewed:** 2026-07-16 · **Fix Batch 1 applied:** 2026-07-17 · **Fix Batch 2 (approved subset) applied:** 2026-07-17 · **Verification re-review passed:** 2026-07-17 · **Scope:** `apps/mobile`, `apps/api`, `packages/db` (admin web app excluded by request).

**Status legend:** ✅ Fixed (unmarked = Batch 1; Batch 2 fixes say so) · ⚠️ Open · ⏸ Deferred (needs product decision) · ❌ Dropped by user decision. Findings without a marker in the LOW lists are ⚠️ Open.

## Current status at a glance

| Status | Findings |
|---|---|
| ✅ Fixed — 35 | C1–C4 · H1, H2, H4, H6 · M1, M3, M4, M6–M9 · A1–A5, A9, A11–A19 · L1, L2, L5, L7, L8 |
| ✅ Fixed — post-review (navigation & UX) | **N1** stranded Paywall after premium login · **N2** finished story reopening on the last page (see Post-review fixes section) |
| ⚠️ Open — your tasks | **H5** RevenueCat webhook secret · **L6** platform keys before store submission · **G1** `git init` |
| ⚠️ Open — code, small | L4 purchases logger · L9 port default · L10 Windows-safe setup script · L11+L12 bundle into the next schema migration (006) · **R1** ErrorBoundary exit route · **R2** StoryPlayer error state · R3–R5 (see re-review) |
| ⚠️ Open — rate limiting | **RL1** upload cap · **RL2** public-GET limiter · **RL3** shared-store/WAF for production (see Rate limiting section) |
| ⏸ Deferred | M2 re-render refactor · M5 test setup · A10 textLight design pass |
| Accepted as-is | L3 StatusBar · L13 pagination · A20 heart-button visible size · A21 spinners |
| ❌ Dropped | H3/A8 read-aloud · A6/A7 48dp hit areas |

Review rubric: the project skills in `.claude/skills/` (react-native-expo, zustand-state, tamagui-theming, api-conventions, db-migrations, accessibility-autism, i18n-conventions) plus Software Mansion's react-native-best-practices. Mobile reviewed by the `react-native-architect` agent, child-UX audited by the `ui-ux-architect` agent, API/DB reviewed inline.

---

## Preflight results (review-time snapshot, 2026-07-16)

| Check | Result |
|---|---|
| `tsc --noEmit` — mobile | ✅ clean |
| `tsc --noEmit` — packages/db | ✅ clean |
| `tsc --noEmit` — apps/api | ✅ clean |
| i18n parity en ↔ sq | ✅ 217/217 keys, no missing, no empty values |
| Migration sequence | ✅ 001–005, no gaps or duplicates |
| Git | ⚠️ **not a git repository** — see finding G1 |

---

## CRITICAL

### C1. Production API URL is a placeholder — release builds can't reach the API — ✅ Fixed
`apps/mobile/src/config/index.ts:11` — `API_URL: __DEV__ ? LOCAL_API : "https://your-production-url.vercel.app"`.
A production/TestFlight build fails every request, and storyStore's silent-offline fallback masks it into an empty story list. The dev branch also hardcodes a LAN IP (`192.168.1.46`, line 7) every developer must hand-edit.
**Fix:** env-driven config (`app.config.ts` + `EXPO_PUBLIC_API_URL` via expo-constants); LAN default for dev only.

### C2. Expo native modules on wrong major versions for SDK 54 — ✅ Fixed
`apps/mobile/package.json:30-31` — `expo-linear-gradient ^55.0.13` and `expo-localization ^55.0.13`; SDK 54 expects `~15.0.8` / `~17.0.9`. These render the difficulty gradients on the child's main screen; version drift risks native build failures or runtime crashes.
**Fix:** `npx expo install expo-linear-gradient expo-localization`; use `~` like every other Expo module in the file. Run `npx expo-doctor`.

### C3. No React error boundaries anywhere — ✅ Fixed
`App.tsx` renders `<Navigator />` bare; zero ErrorBoundary in the codebase. Any render throw (malformed story page, bad persisted value) = abrupt white screen mid-story — exactly the sudden, unpredictable event accessibility-autism.md exists to prevent.
**Fix:** class ErrorBoundary with a calm, theme-styled, translated fallback wrapping `<Navigator />`, plus one around the reading flow.

### C4. JWT secret falls back to a known dev string — ✅ Fixed
`apps/api/src/app/lib/auth.ts:8` — `process.env.JWT_SECRET || "dev-secret-change-me"`. If the env var is ever missing in production, anyone can forge admin tokens.
**Fix:** fail fast when `NODE_ENV === "production"` and `JWT_SECRET` is unset (same pattern the RevenueCat webhook already uses — it 503s without its secret).

---

## HIGH

### H1. `react-native-worklets` at monorepo root, duplicated in the tree — ✅ Fixed
Root `package.json:37` (`^0.8.3`) + a nested `0.8.0` under reanimated 4.1.7; Expo SDK 54 pins `0.5.1`. Version mismatch between the babel-transformed and natively-linked worklets is the classic Reanimated red-screen crash — the animation layer under StoryList's favourites.
**Fix:** remove from root; `npx expo install react-native-worklets` inside apps/mobile; verify with `expo-doctor`. (Babel side is fine: babel-preset-expo auto-injects the worklets plugin.)

### H2. `textSize` accessibility setting is a dead no-op — ✅ Fixed
Set in `SettingsScreen.tsx:288-296`, persisted in `appStore.ts:129`, **read by nothing**. `StoryPlayer.tsx:348` hardcodes `fontSize: 22`. Violates the accessibility-autism hard requirement "Honor the textSize setting for reading text."
**Fix:** map s/m/l → font-size/line-height scale, apply to `storyText`.

### H3. Read-aloud audio button does nothing — ❌ Dropped
`StoryPlayer.tsx:199-210` — the play button has no `onPress` (and no `accessibilityRole`). A primary accessibility affordance for pre-readers that silently fails.
**Fix:** wire to `expo-speech`/audio (gated on the `audio` setting, no autoplay) or hide until implemented.

### H4. Navigation wrappers typed `any` (12 sites) — ✅ Fixed
`Navigator.tsx:172,372,384,393,411,415,419,423,434,446,471,475` — `RootStackParamList` (lines 43-64) is defined but never applied; `route.params.storyId` access is unchecked and, with C3, a runtime crash path.
**Fix:** `NativeStackScreenProps<RootStackParamList, "...">` per wrapper.

### H5. `.env` is missing `REVENUECAT_WEBHOOK_SECRET` — ⚠️ Open (needs your secret)
Present in `.env.example`, absent from `.env`. The webhook (`webhooks/revenuecat/route.ts:75-79`) correctly refuses with 503 — so **no entitlement events sync** in this environment; premium state relies solely on the client SDK.
**Fix:** set the secret in `.env` and in the RevenueCat dashboard webhook config.

### H6. Seed "parent" accounts are actually staff — ✅ Fixed
`packages/db/src/seed.ts:221,229` — "Free Parent" and "Premium Parent" are inserted with role `editor`, giving test parents draft visibility and content-write powers; "Premium Parent" also has no entitlement, so it isn't premium. Test logins misrepresent both the role system and the paywall.
**Fix:** role `parent` for both; give the premium account an entitlement (`entitlement`, far-future `entitlement_expires_at`).

---

## MEDIUM

### M1. 500 responses leak internal error text — ✅ Fixed
`apps/api/src/app/lib/response.ts:34-38` — `serverError()` returns `err.message` (DB constraint text, stack hints) to clients.
**Fix:** log the real error server-side; return a generic message.

### M2. Whole-store subscriptions + unmemoized rows re-render the child's main screen — ⏸ Deferred
`StoryList.tsx:62-63` (`useStoryStore()`, `useAuthStore()` without selectors — zustand-state skill mandates selectors), `Navigator.tsx:275`, Settings, admin screens. `StoryRow`/`FeaturedCard` not memoized; `renderItem` closures rebuilt each render. RevenueCat listener pushes + fetch flags churn the whole list.
**Fix:** selector subscriptions, `React.memo` rows, `useCallback` renderers.
*(Refuted leads: StoryList already uses SectionList + expo-image with disk cache — that part is well done.)*

### M3. iOS and Android ship under different app identities — ✅ Fixed (Batch 2: `com.littleworld.app` on both)
`apps/mobile/app.json` — iOS `com.calmstories.app` (line 16) vs Android `com.littleworld.app` (line 22). RevenueCat per-platform configuration is keyed to bundle ID; divergence invites silent entitlement misbehavior.
**Fix:** one reverse-domain identity on both platforms, aligned with the RevenueCat dashboard.

### M4. `expo-image-picker` permissions unconfigured — ✅ Fixed
`app.json:24` `plugins: []` — no `NSPhotoLibraryUsageDescription`; the admin CMS picker crashes on iOS first use and blocks App Store review.
**Fix:** add the `expo-image-picker` config plugin with translated permission copy.

### M5. Zero automated tests — ⏸ Deferred
No Jest/RNTL anywhere. Minimal high-value setup: `jest-expo` + `@testing-library/react-native`, first targets (all pure functions): `hasValidConsent`/`CONSENT_VERSION` (COPPA), `isTokenExpired`+`decodeBase64` (trial expiry), `computeDashboard` (streak math), StoryList paywall gating, `computeMoodSummary`.

### M6. `appStore.hydrate` trusts persisted JSON verbatim — ✅ Fixed (Batch 2)
`appStore.ts:146` — `set({ ...saved, hydrated: true })` with no validation; a stale/corrupt `themeId`/`locale`/`motion` from an old build is applied as-is (other stores validate with `|| {}` fallbacks — this one is the outlier).
**Fix:** whitelist keys, coerce enums against allowed values.

### M7. Page-delete renumbering can violate the unique constraint — ✅ Fixed
`apps/api/src/app/api/stories/[id]/pages/[pageId]/route.ts:87-96` — single UPDATE renumbers pages; row-processing order isn't guaranteed, so `UNIQUE(story_id, page_number)` can fail intermittently, and delete+renumber isn't one transaction (page deleted, numbering left with gaps → surfaces as 500).
**Fix:** reuse the reorder endpoint's proven pattern (transaction + negate-then-renumber, `reorder/route.ts:46-70`).

### M8. Orphaned Supabase Storage files — ✅ Fixed
Deleting a story/page cascades DB rows (`001_initial.sql:48`) but never calls `deleteFile()` — uploaded images accumulate forever in the bucket.
**Fix:** on story/page DELETE, collect `image_url`s and remove from storage (best-effort, non-blocking).

### M9. No rate limiting or lockout on login — ✅ Fixed
`auth/login/route.ts` — unlimited bcrypt-verified attempts; admin accounts brute-forceable.
**Fix:** simple in-memory/DB-backed attempt counter per email+IP, or a platform limiter when deployed (Vercel/middleware).

---

## LOW

- **L1** ✅ Fixed (Batch 2) — `readingStatsStore.ts:248` — streak loop `for (let i = start; ; i++)` has no upper bound; add a defensive cap (~400).
- **L2** ✅ Fixed (Batch 2: deleted) — Root `pnpm-workspace.yaml` coexists with npm workspaces + package-lock.json — contradicts the project's "npm, never pnpm" rule; delete it.
- **L3** `App.tsx:43` StatusBar `style="dark"` is *correct* for the all-light themes — flagged only as coupling if a dark theme ever lands. No change needed.
- **L4** `services/purchases.ts` — 10 `console.warn` sites; route through a leveled logger silenced in production.
- **L5** ✅ Fixed (Batch 2: fails closed) — `authStore.ts:74` — `isTokenExpired` returns `false` (valid) on malformed tokens; fail-closed (`true`) drops corrupt sessions to free mode immediately.
- **L6** `config/index.ts:20` — RevenueCat key is the shared **test** key (publishable, so committing is OK) — must swap to `appl_…`/`goog_…` before store submission.
- **L7** ✅ Fixed (Batch 2: removed) — `upload/route.ts:29-34,41,55` — debug `console.log` of FormData entries/filenames; remove.
- **L8** ✅ Fixed (Batch 2: email regex, password ≥8, name defaulted server-side) — `auth/register/route.ts` — no email format validation; password minimum only 6 chars; mobile `services/api.ts:82` derives `name` from the email prefix (API requires name, client fakes it).
- **L9** `packages/db/src/connection.ts:14` defaults to port 5432 while docker-compose maps **5433**; masked because `.env` sets `DB_PORT`, but the default is a trap for new machines. Align the default with docker-compose.
- **L10** Root `package.json` `setup` script uses `sleep 3` — fails on Windows cmd/PowerShell (works only in Git Bash); use `node -e "setTimeout(()=>{},3000)"` or wait on the docker healthcheck.
- **L11** `001_initial.sql:26` — `idx_users_email` duplicates the UNIQUE constraint's implicit index; drop in a future migration.
- **L12** Schema uses `TIMESTAMP` (no time zone); prefer `TIMESTAMPTZ` for new columns/tables.
- **L13** `PaginatedResponse` type in shared/types.ts is defined but no endpoint paginates; stories list is unbounded (fine at current content scale — revisit if the catalog grows).
- **G1** **Not a git repository.** No history, no rollback, and Claude Code's `/code-review` + `/security-review` can't run. `git init` + initial commit is the single highest-leverage process fix.

---

## Accessibility & child-UX audit (ui-ux-architect agent)

All 18 child screens, 7 components, TabBar, and App.tsx audited against `accessibility-autism.md`. Contrast ratios computed with the WCAG relative-luminance formula, not estimated. (A4 = H2 and A8 = H3 — both reviewers independently confirmed those.)

### CRITICAL

**A1. "Admin Panel" in Settings reaches staff login with NO parent gate.** ✅ Fixed. `SettingsScreen.tsx:366-376` → `Navigator.tsx:205-207` (`handleAdmin` navigates straight to `Login`). The skill explicitly names admin login as gated content; the "Parent area" row right next to it is gated correctly (`GrownupGate`). **Fix:** route through `GrownupGateScreen` (existing pattern) or remove from child-reachable Settings.

**A2. White-on-primary text fails contrast on ALL 3 themes — app-wide.** ✅ Fixed. `Btn.tsx:45-46` paints `onPrimary` (#FFFFFF) over `t.primary`. Measured: calm-green #82C098 → **2.12:1**, soft-blue #7FA8D8 → **2.47:1**, warm-peach #E8A888 → **2.02:1** (requirement: 4.5:1). Same pattern in `Segment.tsx:36` (selected option), `StoryPlayer.tsx:273` (Next/Finish), `LanguageScreen.tsx:89` (first screen every user sees), `GrownupGateScreen.tsx:98-101` (answer tiles, incl. white on accent #E8A0A0 → **2.11:1**). This is every primary CTA in the app at roughly half the required ratio. **Fix:** use `primaryDeep`/`accentShade`-class fills for text-bearing buttons, or switch button text to `textDark` on the pastel fills.

**A3. Saturated alarm-red leaks into a child-reachable screen.** ✅ Fixed. `PaywallScreen.tsx:11,152` renders purchase errors in `COLORS.admin.danger` = **#E74C3C** (the admin palette's red; `constants.ts:59`). Paywall is reachable by a child tapping any premium story. **Fix:** `theme.accent` (#E8A0A0), the designated soft error color.

**A4. `textSize` never applied where it matters** (= H2). ✅ Fixed. `StoryPlayer.tsx:348-355` hardcodes `fontSize: 22`; the setting is persisted but read by nothing.

**A5. LanguageScreen bypasses i18n entirely.** ✅ Fixed. `LanguageScreen.tsx:24,27,90` hardcodes "Choose your language" / "Zgjidh gjuhën tënde" and a manual `locale === "sq" ? "Vazhdo" : "Continue"` ternary — on the first screen of the app. `common.continue` and `language.*` keys already exist. **Fix:** add `language.heading`/`subheading` to both locale files, use `t()`.

### HIGH

**A6. Toggle (Sound switch) hit area is 32dp.** ❌ Dropped. `Toggle.tsx:34-39` — track 52×32 is the whole touchable, no hitSlop (rule: ≥48dp). Used in `SettingsScreen.tsx:273`.
**A7. Segment control hit area ≈32px.** ❌ Dropped. `Segment.tsx:53-58` (`paddingVertical: 7`, 13px text) — and it's the control for the **textSize and motion** settings themselves. **Fix:** `minHeight: 48`.
**A8. Read-aloud button dead** (= H3). ❌ Dropped. `StoryPlayer.tsx:199-210` — no `onPress`, no `accessibilityRole`. Audio defaults ON, so most children will tap it and get nothing — cause-and-effect breakage in an app whose design promise is predictability.
**A9. Guardian consent is self-attestation; `ageChoice` is discarded.** ✅ Fixed. `ConsentGate.tsx:71-79` — a child can tick "I confirm I am the parent/guardian" themselves; `AgeGateScreen`'s child/adult answer (`appStore.ts:5,28`) is never branched on downstream. The most COPPA-sensitive moment has weaker verification than the in-app Parent Area (math challenge). **Fix:** require the `GrownupGateScreen` challenge at consent (at minimum when `ageChoice === "child"`).

### MEDIUM

- **A10.** ⏸ Deferred — `textLight` #7F8C8D on bg/surface ≈ **3.48:1** — fails AA for the 11–15px non-bold text it's used for pervasively (`ScreenHeader.tsx:77-79`, StoryList meta/section text, Settings subs, `MoodCheckIn.tsx:53`). Darken the token (~#6B7A80) or reserve for decorative text.
- **A11.** ✅ Fixed (Batch 2) — "Log Out" in `theme.accent` on white (`SettingsScreen.tsx:352`) → **2.11:1**; also misuses the error accent for a neutral action.
- **A12.** ✅ Fixed (Batch 2) — GrownupGate wrong-answer **shake ignores `motion`** (`GrownupGateScreen.tsx:42-49` never reads the setting — every other animated screen does).
- **A13.** ✅ Fixed (Batch 2: one fall per piece, two pulses, then still) — `StoryComplete.tsx:140-169` confetti/pulse `Animated.loop`s run **unbounded** while mounted; obeys "off" but never stops otherwise — persistent stimulation against the calm goal. Cap at ~4-6s.
- **A14.** ✅ Fixed (Batch 2) — Off-theme hardcoded hex in child screens: `#7A4F1A` (`StoryList.tsx:558`), `#FBEAE8`/`#C0392B` dialog pair (`ParentDashboardScreen.tsx:477,495` — passes contrast at 4.67:1 but bypasses the theme system).
- **A15.** ✅ Fixed (Batch 2) — `expo-image` `transition={200}` unconditioned on `motion` (`StoryList.tsx:317,401`, `StoryPlayer.tsx:159-163`) — should be 0 when motion is off.
- **A16.** ✅ Fixed (Batch 2) — StoryPlayer "Previous" `Btn` lacks an explicit `accessibilityLabel` (`StoryPlayer.tsx:236-259`; "Next" has one).

### LOW

- **A17.** ✅ Fixed (Batch 2: both deleted) — `PrivacyScreen.tsx` + `CheckRow.tsx` are unreachable dead code (superseded by PrivacyPolicy/PolicyScreen), and the orphan contains a broken no-`onPress` button — delete to prevent accidental re-wiring.
- **A18.** ✅ Fixed (Batch 2: math challenge kept, email gate deleted with its route, `parentGate.*` keys, and `parentEmail` state) — `ParentGateScreen` (email gate) is registered in Navigator but never navigated to — two competing parent-verification implementations exist; keep one.
- **A19.** ✅ Fixed (Batch 2) — `Toggle`/`Segment` rely on implicit child-text for screen-reader labels — add explicit `accessibilityLabel`.
- **A20.** StoryList heart button: 32×32 visible with hitSlop to ~56 — passes the letter of 48dp but the visible affordance is small for a child.
- **A21.** `ActivityIndicator` spinners not gated by `motion` (standard/brief; lowest priority).

### Model screens (per the auditor — don't regress)
`MoodCheckIn.tsx` and `ScreenHeader.tsx`: correct 48dp targets, full accessibility props, double-tap guards, no autoplay.

---

## What's already good (don't regress these)

- **API security posture**: 100% parameterized SQL; narrowest-correct guards everywhere (`requireAdmin` on uploads, `requireStaff` on content writes); premium enforced **server-side** via `hasActiveEntitlement`; drafts return 404 not 403 (no existence leak); webhook refuses to run unconfigured + timing-safe secret compare + bounded TRANSFER window.
- **Reorder endpoint** (`pages/reorder/route.ts`): validates the exact page set, transaction with negate-then-renumber — the model for M7's fix.
- **Migration discipline**: append-only, per-file transactions, tracked by name; 002/003 do backfills correctly.
- **Password migration**: legacy SHA-256 hashes transparently upgraded to bcrypt on login, timing-safe legacy compare.
- **Mobile**: MoodCheckIn + ScreenHeader are model accessibility screens (48dp, roles/labels, double-tap guards); purchases service degrades gracefully on web/Expo Go; storyStore's silent-offline fallback implements "never flash an error over content a child is looking at"; i18n at exact parity (217/217 at review, 222/222 after Batch 1's new keys).

---

## Fix Batch 1 — ✅ APPLIED 2026-07-17

All 16 items below are implemented and verified (typecheck clean ×3 workspaces, i18n 222/222, expo-doctor 17/18 — the one remaining flag is the intentional monorepo/Windows metro.config.js). Extras done along the way: root `overrides` now pin `react-native-worklets@0.5.1` and `expo@~54.0.36` (single copies tree-wide), `expo`/`react-native-svg` snapped to SDK-expected versions, and metro's watchFolders extends Expo's defaults instead of replacing them.

Child-safety first, then shipping blockers, then hardening:

1. **A1** — Settings "Admin Panel" now routes `GrownupGate → Login`; the gate gained a typed `next` param (`Navigator.tsx`) so one gate protects both the parent area and admin login
2. **A2** — text-bearing fills switched to `primaryDeep` (verified 5.09/7.04/6.48:1 white-on-fill across themes) in `Btn`, `Segment` selected state, StoryPlayer play button, LanguageScreen continue, GrownupGate correct tile; danger/wrong-answer styles now use `textDark` on the soft `accent` (5.21:1)
3. **A3** — *implemented differently than proposed*: `theme.accent` as text on white fails contrast too (2.11:1, see A11), so Paywall errors render as a calm advisory chip — `secondaryDeep` on `secondarySoft` (4.87:1), the same pairing ConsentGate's advisory panel uses
4. **C1** — `EXPO_PUBLIC_API_URL` now drives `CONFIG.API_URL` (`src/config/index.ts`); release builds without it log a loud startup error instead of silently using a placeholder. **Set this env var before any production build**
5. **C2 + H1** — `expo-linear-gradient ~15.0.8`, `expo-localization ~17.0.9`, `expo ~54.0.36`, `react-native-svg 15.12.1`; worklets/expo duplication kept resurrecting from the lockfile, so the durable fix is root `overrides` pinning `react-native-worklets@0.5.1` and `expo@~54.0.36` — the tree now holds exactly one copy of each (verified via `npm ls` + `expo-doctor`)
6. **C3** — new `components/ErrorBoundary.tsx` (calm translated fallback + retry); wraps `<Navigator />` in App.tsx and `StoryPlayer` in its route wrapper; strings added to both locales under `common.error*`
7. **C4 + M1** — API throws at startup if production lacks `JWT_SECRET`; `serverError()` now logs internally and returns a generic message
8. **H2/A4** — `TEXT_SIZES` map (s 18/27 · m 22/32 · l 26/38) applied to `storyText` from the `textSize` setting
9. **A5** — LanguageScreen fully through `t()`; `language.heading`/`language.subheading` added to both locales (i18n now 222/222)
10. **H4** — all 12 wrappers + `ChildMainScreen` typed via `NativeStackScreenProps<RootStackParamList, …>` helper
11. **H6** — seed parents get role `parent`; premium account carries a non-expiring promotional `"Little World Premium"` entitlement
12. **M4** — `expo-image-picker` plugin with iOS photo-permission string (`expo-localization` plugin auto-added by expo install)
13. **M7** — page delete + renumber now one transaction using the reorder endpoint's negate-then-renumber pattern
14. **M8** — story/page DELETE collects `cover_image_url`/`image_url`s and best-effort removes them from Supabase Storage (`Promise.allSettled`, never fails the request)
15. **M9** — new `lib/rateLimit.ts` fixed-window limiter; login allows 5 attempts / 15 min per email+IP, cleared on success, 429 otherwise
16. **A9** — onboarding inserts the GrownupGate challenge between Terms and Consent when `ageChoice === "child"`; `ageChoice` is no longer discarded

Deliberately deferred to a later batch (need product decisions, not just code): **A13** (confetti cap), **M2** (re-render refactor), **M5** (test setup), **A10** (textLight token change affects all 3 themes' look). Dropped by user decision: H3/A8 (read-aloud), A6/A7 (48dp hit areas), G1 (git init).

---

## Post-batch log (2026-07-17)

Issues that surfaced while running the app after the batch, and their resolutions:

1. **`expo start` failed** with `Cannot find module '...\apps\mobile\node_modules\expo\bin\cli'` — fallout from the expo dedupe: stale CLI shims in `apps/mobile/node_modules/.bin` pointed at the removed workspace-local copy. Removed the shims, `npm install` regenerated them against the hoisted root copy; verified Metro starts cleanly.
2. **Login returned 500** (`column "trial_used" does not exist`) — the local Docker database was still on migrations 001–002 while the code queries columns from 003+. Ran `npm run db:migrate` (applied 003–005), confirmed the DB held only pristine seed data, then `npm run db:seed` to pick up the H6 fix. Seed accounts now verified in Postgres: both parents `role=parent`, premium has the `Little World Premium` entitlement, `trial_used=false` on all three. Rule of thumb: any `column … does not exist` API error → run `npm run db:migrate` first (idempotent, safe anytime).
3. **Environment note:** no Android SDK/adb on this machine — `a` (open Android) in Expo can't work without Android Studio. Testing paths that work today: Expo Go on a physical phone (QR from `npm run dev:mobile`) or web (`w`). RevenueCat no-ops in both by design.
4. **Metro config:** `watchFolders` now *extends* Expo's defaults instead of replacing them; the remaining `expo-doctor` flag (17/18) covers the deliberate `.mjs` exclusion and Windows polling watcher — accepted as intentional.

---

## Fix Batch 2 — ✅ APPLIED (user-approved subset) 2026-07-17

Applied: both decisions, all Stability & correctness, all Calm & accessibility, and Hygiene items 12–14. Verified: typecheck clean ×3 workspaces, i18n at 214/214 parity (8 `parentGate.*` keys removed with the dead screen), zero residual references to deleted code or off-theme hex.

**Excluded by user decision:** L4 (purchases logger), L9 (port default), L10 (Windows-safe setup script), M2 (re-render refactor), M5 (test setup) — these remain ⚠️ Open / ⏸ Deferred below.

### Decisions (resolved)
- **D1 (for M3):** `com.littleworld.app` on both platforms — iOS `bundleIdentifier` updated to match Android. Remember to key the RevenueCat dashboard apps to this ID.
- **D2 (for A18):** the math challenge stays; the email-verification `ParentGateScreen` was deleted along with its route, wrapper, `parentGate.*` locale keys, and the `parentEmail`/`setParentEmail` appStore state.

### Stability & correctness
1. **M6** — validate persisted JSON in `appStore.hydrate`: whitelist known keys, coerce `themeId`/`locale`/`textSize`/`motion` against allowed values
2. **L5** — `isTokenExpired` fail-closed: malformed token → treated as expired → clean drop to free mode
3. **L1** — cap the streak loop in `readingStatsStore.computeDashboard` (~400 iterations)
4. **L8** — register route: email format validation; raise password minimum to 8; stop deriving `name` from the email prefix client-side (send it or make it optional server-side)

### Calm & accessibility (completes the audit's Medium tier)
5. **A12** — GrownupGate wrong-answer shake respects `motion` ("off" → no shake)
6. **A15** — `expo-image` `transition={motion === "off" ? 0 : 200}` in StoryList + StoryPlayer
7. **A13** — cap StoryComplete confetti/pulse loops at ~5 seconds
8. **A11** — "Log Out" in `textDark` (accent-on-white is 2.11:1 and misuses the error color)
9. **A14** — replace off-theme hex (`#7A4F1A`, `#FBEAE8`/`#C0392B`) with theme tokens
10. **A16 + A19** — explicit `accessibilityLabel` on StoryPlayer "Previous", `Toggle`, `Segment`

### Hygiene
11. **A17** — delete dead `PrivacyScreen.tsx` + `CheckRow.tsx` (one has a broken no-`onPress` button)
12. **L2** — delete `pnpm-workspace.yaml`
13. **L7** — remove upload route's debug `console.log` of FormData

### NOT applied (excluded from this batch by user decision — still open/deferred)
- **M2** — selector subscriptions + `React.memo` rows + `useCallback` renderers (StoryList/Navigator/Settings)
- **M5** — jest-expo + RNTL test setup (five pure-function targets)
- **L4** — leveled logger for `services/purchases.ts`
- **L9** — align `connection.ts` default port with docker-compose (5433)
- **L10** — Windows-safe root `setup` script

### Your tasks (only you can do these)
- **H5** — set `REVENUECAT_WEBHOOK_SECRET` in `.env` and the RevenueCat dashboard — until then, server-side entitlements never sync
- **L6** — swap the RevenueCat test key for `appl_…`/`goog_…` platform keys before store submission (release-checklist item)
- **G1** — `git init` + initial commit (dropped from Batch 1; still recommended — it's the rollback story and unlocks `/code-review`)

### Explicitly not in Batch 2
- **A10** (darken `textLight`) — changes the look of all 3 themes everywhere; deserves its own design pass with before/after screens
- **L11/L12** — bundle into the next real schema migration (006) rather than a migration for their own sake
- **L3, L13, A20, A21** — accepted as-is / no action needed

---

## Verification re-review — 2026-07-17 (after both batches)

Full verification pass: preflight suite inline, API/DB fixes re-verified inline, mobile app re-swept by the `react-native-architect` agent instructed to be skeptical of the fixes themselves.

### Verdict: ✅ everything holds

- **All 16 mobile fix areas verified in code** with file:line evidence — config, ErrorBoundary, Navigator typing/gating/consent flow, Btn/Segment/Toggle colors and labels, StoryPlayer textSize/motion, StoryList motion gating, StoryComplete bounded animations, GrownupGate, sanitizeSaved, fail-closed tokens, streak cap, register payload, i18n, app.json, deletions, dependency pins.
- **All 8 API/DB fixes verified on disk** with correct semantics (rate-limit clear only after successful auth; storage cleanup best-effort after cascade).
- **Preflight:** typecheck ✅×3 · i18n 214/214 · single expo 54.0.36 + worklets 0.5.1 · migrations 5/5 applied in DB · expo-doctor 17/18 (known intentional metro config) · all 7 load-bearing contrast pairs recomputed, 4.87–10.98:1, every one passes AA.
- Notably verified: a production build with no `EXPO_PUBLIC_API_URL` degrades to the calm empty-list state, not a crash.

### New findings from the re-review

- **R1 (Low).** The ErrorBoundary fallback offers only "Try again" — for a *deterministic* render crash inside the StoryPlayer boundary (which replaces the whole subtree, header included), retry → re-throw → fallback, with no visible in-app way back to the story list (OS back gestures still work). **Fix idea:** `onExit` prop on the boundary wired to `navigation.goBack()`.
- **R2 (Low, pre-existing).** `StoryPlayer.tsx:125-131` shows an **infinite spinner** when `fetchStory` fails (store sets `error`, leaves `currentStory` null, `isLoading` false — no error/empty branch in the player). Reachable offline with a cached list. The list degrades calmly; the player doesn't.
- **R3 (note).** With H3/A8 dropped, the read-aloud button is now a *labeled* discoverable dead control (56dp target + `accessibilityLabel`, `audio` defaults ON, still no `onPress`). If it stays unimplemented, hiding it is kinder than labeling it.
- **R4 (docs).** `config/index.ts:13-14` comment claims the missing-env case reaches the ErrorBoundary; actually `console.error` doesn't throw — real behavior is the calm empty list. Comment-only.
- **R5 (cosmetic).** `expo-image-picker` pinned exact `17.0.11` instead of `~17.0.11`.
- Also corrected in this pass: this report's Batch 2 section previously still listed the excluded items (M2, M5, L4, L9, L10) inside the applied list — now split out explicitly.

---

## Rate limiting — coverage & TODO (2026-07-17)

Password reset + auth rate-limiting shipped. Recording the remaining gaps as tracked TODOs rather than building them now — the auth surface (the real brute-force target) is fully covered, and the biggest remaining lever is the limiter's architecture, not more per-route limits.

### Covered today
All via the in-memory `rateLimit()` helper (`apps/api/src/app/lib/rateLimit.ts`):
- `POST /api/auth/login` — 5 / 15 min per email+IP (cleared on success)
- `POST /api/auth/register` — 5 / 15 min per IP
- `POST /api/auth/forgot-password` — 3 / 15 min per email+IP
- `POST /api/auth/reset-password` — 5 / 15 min per email+IP, plus a 5-wrong-guess cap that burns the code

### Open TODOs
- **RL1 (Low–Med) — Upload cap.** `POST /api/upload` has no limit. It's admin-gated, but writes 5 MB files to Supabase Storage (real cost/quota) — a leaked admin token or a buggy client loop could rack it up. Add a per-user cap (~30 / 5 min) reusing `rateLimit()`, keyed `upload:${user.id}`.
- **RL2 (Low) — Public GET burst limiter.** `GET /api/stories`, `/api/stories/[id]`, and pages GET are unauthenticated and scrapable. Content is non-sensitive (published stories) and the app caches heavily, so the only risk is DoS/bandwidth. Optional light per-IP limit — but weak on serverless without RL3.
- **RL3 (Med — the important one) — Shared-store / edge limiter for production.** `rateLimit()` is in-memory and per-process; on Vercel serverless each instance has its own counter, so today's limits blunt single-instance bursts but not distributed attacks. Production fix: move to a shared store (**Upstash Redis** — standard Vercel pairing) or a platform **WAF / edge rate limit** (Vercel or Cloudflare). Highest leverage: it makes every existing auth limit actually hold at scale.

### Deliberately NOT rate-limited
- **RevenueCat webhook** — secret-gated already, and RevenueCat retries on any non-2xx, so a limiter would drop legitimate subscription events.
- **Story/page writes** (POST/PUT/DELETE) — gated by `requireStaff`/`requireAdmin`; the auth check rejects unauthenticated abuse before any work happens.

---

## Post-review fixes — navigation & reading UX (2026-08-11)

Bugs found by the user in real use after the review, both fixed. Navigation-stack / reading-flow issues, not in the original findings.

### N1 — ✅ Fixed · "Back to stories" landed on the Paywall after premium login
`apps/mobile/src/navigation/Navigator.tsx` (`LoginRegisterWrapper.onSuccess`). Premium tap while logged-out built the stack `[ChildMain, Paywall, LoginRegister]`; login success used `navigation.replace("MoodCheckIn")`, which swaps only the top screen and **left the Paywall stranded underneath** (`[ChildMain, Paywall, StoryPlayer]`). Finishing the story → "Back to stories" (`goBack()`) then surfaced that Paywall instead of the story list — the user was still logged in; purely a stack bug. **Fix:** on login success from a premium tap, `navigation.reset` rebuilds a clean stack rooted at `ChildMain` (→ `MoodCheckIn` if subscribed, else `Paywall`) instead of `replace`. Also removes a latent double-Paywall in the not-subscribed branch. Settings-login path unchanged.

### N2 — ✅ Fixed · Finished stories reopened on the last page
`apps/mobile/src/screens/child/StoryPlayer.tsx`. Resume used only `lastReadPage`, saved on every page turn, with no concept of "finished" — so tapping through to the final page (6/6) saved page 6, and reopening resumed there. **Fix:** a once-per-mount resume resolver (runs during render, before first paint — no flash) treats *saved page ≥ last page* as finished → start at page 1; a lower saved page still resumes mid-story (e.g. 5/6 → page 5). The home "Continue" card is unaffected and still shows full progress for a finished story (accurate), since the saved page isn't rewritten on finish.
