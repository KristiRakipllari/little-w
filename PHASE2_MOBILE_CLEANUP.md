# Phase 2 — Remove admin from `apps/mobile` + parent-facing rename

Self-contained handoff. Phase 1 (the standalone web admin in `apps/admin`) is **done and building** (`npm run build -w @calm-stories/admin`). This document is Phase 2 only: strip all admin surface from the mobile app and rename the remaining auth code to be clearly *parent*-facing. **Do not touch `apps/api` or `packages/db`.**

## Decision already made with the user (do not re-litigate)

**Clean separation.** Mobile keeps *consumer/parent* auth (parent login, RevenueCat subscriptions, trial, the password-reset OTP flow) because the child app genuinely depends on it. Mobile loses **all** admin notions — not just the screens, but the `mode:"admin"` switch and staff-role gating too. Staff auth now lives only in the web admin.

Plus these renames so nothing reads as generic "auth":
- `apps/mobile/src/screens/auth/` → `apps/mobile/src/screens/parent/`
- `store/authStore.ts` → `store/parentStore.ts`; `useAuthStore` → `useParentStore`; storage keys → `lw_parent_*`
- split `services/api.ts` into `services/client.ts` (base fetch) + `services/parent.ts` (parent auth) + `services/stories.ts` (public reads); **delete all admin endpoints**

## Constraints

- TypeScript strict, **no `any`**. Reuse `@calm-stories/shared` types.
- Do not modify any child screen's behavior/theme beyond the mechanical `useAuthStore`→`useParentStore` rename and removing the admin "Admin Panel" row from Settings.
- COPPA posture unchanged (no analytics, no external calls beyond the API).
- End state: mobile has **zero** admin surface and no path to reach admin. Do **not** add a link to the web admin.

## Reference map (every file that touches the affected symbols)

`useAuthStore` / `store/authStore` / `attachPurchasesSync`:
- `navigation/Navigator.tsx`, `screens/admin/Dashboard.tsx` (deleting), `screens/auth/Login.tsx` (renaming), `screens/child/ParentDashboardScreen.tsx`, `screens/child/PaywallScreen.tsx`, `screens/child/SettingsScreen.tsx`, `screens/child/StoryList.tsx`, `store/authStore.ts`, **and `apps/mobile/App.tsx`** (imports `{ useAuthStore, attachPurchasesSync }` + `loadSession`; it's outside `src/` so it won't show in `src` greps — don't miss it).

`services/api`:
- `screens/admin/PageEditor.tsx` (deleting), `screens/auth/ForgotPassword.tsx` (renaming), `store/authStore.ts`, `store/storyStore.ts`.

`expo-image-picker`: only `screens/admin/PageEditor.tsx` → dependency becomes removable.

`@react-navigation/bottom-tabs`: no references (already dead) → removable.

---

## Tasks (ordered)

### 1. Services split (`apps/mobile/src/services/`)

Current `services/api.ts` contains: a private `request()` wrapper, `setUnauthorizedHandler`/`onUnauthorized`, `AUTH_ENDPOINTS`, and functions: `login, register, forgotPassword, verifyResetCode, resetPassword, getStories, getStory, createStory, updateStory, deleteStory, getPages, createPage, updatePage, deletePage, reorderPages, uploadFile, deleteUploadedFile`.

Create **`services/client.ts`**: move `request` (export it), `setUnauthorizedHandler`, `onUnauthorized`, and `AUTH_ENDPOINTS` here. It reads the JWT from `AsyncStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN)` (which becomes `lw_parent_token`, see task 3) and imports `CONFIG` + `API_ENDPOINTS`.

Create **`services/parent.ts`**: `login, register, forgotPassword, verifyResetCode, resetPassword` — each importing `{ request }` from `./client`. (These map to `API_ENDPOINTS.AUTH.*`.)

Create **`services/stories.ts`**: `getStories, getStory` only — importing `{ request }` from `./client`.

**Delete `services/api.ts`** and with it every admin endpoint: `createStory, updateStory, deleteStory, getPages, createPage, updatePage, deletePage, reorderPages, uploadFile, deleteUploadedFile`.

Keep `services/purchases.ts` untouched.

### 2. `store/storyStore.ts` — reads only

- Change `import * as api from "@/services/api"` → `import * as stories from "@/services/stories"`; update `api.getStories`/`api.getStory` → `stories.*`.
- Remove from the `StoryState` interface **and** the implementation: `createStory, updateStory, deleteStory, addPage, updatePage, deletePage, reorderPages`. Keep `stories`, `currentStory`, `isLoading`, `error`, `lastFetched`, `fetchStories`, `fetchStory`, `clearError`, `clearCurrentStory`, and the `persist` config.

### 3. `store/authStore.ts` → `store/parentStore.ts`

Rename the file; rename `useAuthStore` → `useParentStore` (keep `attachPurchasesSync` export name). Then:
- Imports: `import * as parent from "@/services/parent"` (was `* as api from "@/services/api"`) and `import { setUnauthorizedHandler } from "@/services/client"`. Update the bottom-of-file `api.setUnauthorizedHandler(...)` → `setUnauthorizedHandler(...)`.
- **Remove admin notions**: delete the `AppMode` type, the `mode` state field, `setMode`, all reads/writes of `CONFIG.STORAGE_KEYS.APP_MODE`, and the `isAdmin`/role branching in `login()` (a parent login no longer sets a mode). `logout()` no longer resets `mode`.
- **Storage keys → `lw_parent_*`.** Consolidate to a single token key. Suggested mapping:
  | old | new |
  |---|---|
  | `calm_auth_token` (AUTH_TOKEN) | `lw_parent_token` |
  | `calm_user_data` (USER_DATA) | `lw_parent_user` |
  | `calm_app_mode` (APP_MODE) | **removed** |
  | `calm_parent_token` (PARENT_TOKEN) | drop (redundant with token) |
  | `calm_parent_email` (PARENT_EMAIL) | drop (parent-email gate was removed earlier) |
  | `calm_is_subscribed` (IS_SUBSCRIBED) | `lw_parent_subscribed` |
  | `calm_trial_used` (TRIAL_USED) | `lw_parent_trial_used` |
  Also update `apps/mobile/src/config/index.ts` `CONFIG.STORAGE_KEYS` (rename `AUTH_TOKEN`→`lw_parent_token`, `USER_DATA`→`lw_parent_user`, delete `APP_MODE`). Note: `services/client.ts` reads `CONFIG.STORAGE_KEYS.AUTH_TOKEN`, so keep that property name (value `lw_parent_token`) or update both sides consistently. Renaming keys logs out current dev sessions — fine pre-release.
- Keep everything consumer-facing: `user, token, isLoading, error, isSubscribed, hydrated, trialUsed`, `login, register, logout, loadSession, refreshSubscription, markTrialUsed, clearError`, the `decodeBase64`/`isTokenExpired`/`hasServerEntitlement` helpers, and `attachPurchasesSync`.

### 4. Screens

- **Delete `screens/admin/`** entirely (`Dashboard.tsx`, `StoryForm.tsx`, `PageEditor.tsx`).
- **Rename `screens/auth/` → `screens/parent/`** (`Login.tsx`, `ForgotPassword.tsx`).
  - `Login.tsx`: `useAuthStore` → `useParentStore`.
  - `ForgotPassword.tsx`: `import * as api from "@/services/api"` → `import * as parent from "@/services/parent"`; update `api.forgotPassword/verifyResetCode/resetPassword` → `parent.*`.

### 5. `navigation/Navigator.tsx`

- Remove admin imports: `Dashboard`, `StoryForm`, `PageEditor`. Repoint `Login` → `@/screens/parent/Login`, `ForgotPassword` → `@/screens/parent/ForgotPassword`.
- `RootStackParamList`: delete `Login`, `AdminTabs`, `StoryForm`, `PageEditor`. Change `GrownupGate: { next?: "ParentDashboard" | "Login" } | undefined` → `GrownupGate: undefined` (ParentDashboard is now the only pass target).
- Root navigator: **delete the entire `mode === "admin" && user ? (…) :` branch**; the tree becomes `!hasValidConsent(consentData) ? <Onboarding …> : <child flow …>`. Remove `mode` (and `user` if now unused) from the `useAuthStore`/`useParentStore` call in the `Navigator()` function.
- Delete the admin `Login` `<Stack.Screen>` and the `AdminLoginWrapper` function. **Keep** `LoginRegisterWrapper` (parent premium login) and `ForgotPasswordWrapper`; update their store references to `useParentStore`.
- `GrownupGateWrapper`: drop the `next` param handling; always `navigation.replace("ParentDashboard")`.
- `ChildMainScreen`: remove `handleAdmin` and stop passing `onAdmin` to `SettingsScreen`.

### 6. `screens/child/SettingsScreen.tsx`

- Remove the **"Admin Panel"** row and the `onAdmin` prop from its Props (and any `handleAdmin` usage). Remove the i18n string usage `settings.adminPanel` (you may leave the key in the locale files or delete from both `en.json`+`sq.json` together — keep parity either way).
- `useAuthStore` → `useParentStore`.

### 7. Remaining consumers (mechanical rename)

`useAuthStore` → `useParentStore` and fix the import path (`@/store/authStore` → `@/store/parentStore`) in: `screens/child/StoryList.tsx`, `screens/child/PaywallScreen.tsx`, `screens/child/ParentDashboardScreen.tsx`, and **`apps/mobile/App.tsx`** (`{ useAuthStore, attachPurchasesSync }` + the `loadSession` selector).

### 8. Dependencies (`apps/mobile/package.json`)

- Remove `expo-image-picker` (only the deleted admin PageEditor used it) — **and** remove its config-plugin entry from `apps/mobile/app.json` `plugins` (added earlier as finding M4), or `expo` config will error on a missing plugin.
- Remove `@react-navigation/bottom-tabs` (unused).
- Leave everything else (RevenueCat, reanimated, gesture-handler, etc.) intact.

---

## Verification

1. `npm run typecheck --workspace @calm-stories/mobile` — must be clean (catches dangling imports/renames).
2. Grep the mobile `src` for leftovers — all should return **nothing**:
   `useAuthStore`, `services/api`, `screens/admin`, `screens/auth`, `expo-image-picker`, `mode === "admin"`, `AdminTabs`, `setMode`, `store/authStore`.
3. i18n parity (if you touched locale files): flatten `en.json`/`sq.json` and diff — equal counts, no drift.
4. Confirm the app's entry still boots into the child flow: `App.tsx` → `parentStore.loadSession()` + `attachPurchasesSync()` run; `Navigator` renders Onboarding or ChildMain (no admin branch).

## Gotchas

- **`App.tsx` is outside `src/`** — easy to miss; it imports the store and calls `loadSession`/`attachPurchasesSync`.
- Two components consume the parent `Login` screen: `LoginRegisterWrapper` (keep) and `AdminLoginWrapper` (delete). Only remove the admin one.
- The base fetch wrapper reads `CONFIG.STORAGE_KEYS.AUTH_TOKEN`; if you rename that config property, update `services/client.ts` too, or the Bearer header silently goes missing.
- Removing `expo-image-picker` **and** its `app.json` plugin must happen together.
- Storage-key rename logs out existing sessions on next launch — acceptable pre-release; don't add a migration.

## Then Phase 3 (docs/dev wiring — can be same session)

- Root `package.json`: `"dev"` → `concurrently "npm run dev:api" "npm run dev:mobile" "npm run dev:admin"` (keep individual scripts).
- Root `.env.example`: note the admin env vars (`NEXT_PUBLIC_API_URL`, `SESSION_COOKIE_NAME`) live in `apps/admin/.env.local` (see `apps/admin/.env.local.example`).
- `README.md`: remove the "Settings > Admin Panel" line; add an **Admin Panel (web)** section (`npm run dev:admin` → http://localhost:3001/login → seeded `admin@littleworld.app` / `admin123`; production = its own Vercel site pointed at the API via `NEXT_PUBLIC_API_URL`); update the "Admin Mode" screens section to say admin now lives in `apps/admin` on the web.
- Add `apps/admin/README.md` (setup, env vars, Vercel deploy notes).
- Final: `npm run build:api`, `npm run build -w @calm-stories/admin`, `npm run typecheck --workspace @calm-stories/mobile`. Report any errors.

## Known limitation carried from Phase 1 (mention in report, don't "fix" by touching the API)

The API's `POST /api/upload` accepts **images only** (`png/jpeg/webp`). The web PageEditor therefore does true file upload for images, and exposes audio as an **audio-path field** (persisted via `updatePage` `audio_path_sq/en`) rather than a file upload. Real audio upload needs `/api/upload` to allow audio MIME types — out of scope while the API is frozen.
