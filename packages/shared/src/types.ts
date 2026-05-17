// ─── User / Auth ─────────────────────────────

export type UserRole = "admin" | "editor";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  access_token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
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
