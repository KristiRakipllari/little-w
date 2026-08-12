// ─── User / Auth ─────────────────────────────

export type UserRole = "admin" | "editor" | "parent";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  // Server-tracked: true once the account's 7-day free week is consumed.
  // Survives reinstalls / cleared app data, unlike any client-side flag.
  trial_used: boolean;
  // Server-side subscription state, kept in sync by the RevenueCat webhook.
  // Access is valid while entitlement is set and expires_at is null/future.
  entitlement?: string | null;
  entitlement_expires_at?: string | null;
  entitlement_store?: string | null;
  // False until the parent clicks the link emailed at registration. Not a
  // privilege flag — it gates only the START of a purchase, so a paying
  // customer always has a working address for account recovery later.
  email_verified: boolean;
  // Server-side record of the on-device COPPA consent, captured at
  // registration (or backfilled at next login). Null for accounts created
  // before capture existed. Client-asserted, not independently verified.
  consent_version?: number | null;
  consent_accepted_at?: string | null;
  consent_guardian_confirmed?: boolean | null;
  created_at: string;
  updated_at: string;
}

// Snapshot of the device's onboarding consent, sent with register/login.
export interface ConsentRecord {
  version: number;
  accepted_at: string;
  guardian_confirmed: boolean;
}

export interface AuthTokens {
  access_token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
  // Backfills the consent columns when they are still null — an account
  // created before consent capture existed gets its record on next login.
  consent?: ConsentRecord;
}

export interface RegisterRequest {
  email: string;
  password: string;
  // Optional — the API defaults it to the email prefix when omitted.
  name?: string;
  role?: UserRole;
  // Language for the verification email and the page its link opens.
  locale?: SupportedLocale;
  consent?: ConsentRecord;
}

export interface ResendVerificationRequest {
  email: string;
  locale?: SupportedLocale;
}

// GET /api/auth/me. `verification_enforced` mirrors whether the API can
// actually send mail: when it can't, nobody could ever verify, so the client
// must not gate anything on it.
export interface MeResponse {
  user: User;
  verification_enforced: boolean;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface VerifyResetCodeRequest {
  email: string;
  code: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  password: string;
}

// ─── Story ───────────────────────────────────

export type DifficultyLevel = "beginner" | "medium" | "advanced";

export interface Story {
  id: string;
  title: string;
  description: string;
  cover_image_url: string | null;
  level: DifficultyLevel;
  is_premium: boolean;
  is_published: boolean;
  page_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface StoryWithPages extends Story {
  pages: StoryPage[];
}

export interface CreateStoryRequest {
  title: string;
  description: string;
  level: DifficultyLevel;
  is_premium: boolean;
  cover_image_url?: string;
}

export interface UpdateStoryRequest extends Partial<CreateStoryRequest> {
  is_published?: boolean;
}

// ─── Locale ─────────────────────────────────

export const SUPPORTED_LOCALES = ["sq", "en"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const LOCALE_LABELS: Record<SupportedLocale, string> = {
  sq: "Shqip",
  en: "English",
};

// ─── Story Page ──────────────────────────────

export interface StoryPage {
  id: string;
  story_id: string;
  page_number: number;
  image_url: string | null;
  text_sq: string;
  text_en: string;
  audio_path_sq: string | null;
  audio_path_en: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePageRequest {
  text_sq: string;
  text_en: string;
  image_url?: string;
  audio_path_sq?: string;
  audio_path_en?: string;
}

export interface UpdatePageRequest extends Partial<CreatePageRequest> {}

export interface ReorderPagesRequest {
  page_ids: string[];
}

// ─── API Response ────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
}
