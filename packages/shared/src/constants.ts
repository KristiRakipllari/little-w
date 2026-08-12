import type { SupportedLocale } from "./types";

export const APP_NAME = "Little World";

export const DIFFICULTY_LEVELS = ["beginner", "medium", "advanced"] as const;

export const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: "Beginner",
  medium: "Medium",
  advanced: "Advanced",
};

export const FREE_STORY_LIMIT = 3;
export const FREE_TRIAL_DAYS = 7;
export const SUBSCRIPTION_PRICE = 2.99;
export const SUPPORT_EMAIL = "hello@littleworld.app";

// RevenueCat entitlement identifier — must match the dashboard exactly.
// Used by the mobile SDK checks and the API webhook alike.
export const PREMIUM_ENTITLEMENT_ID = "Little World Premium";

// ─── Consent / policy versioning ────────────
// Single source of truth. CONSENT_VERSION is what gets stored against an
// account, so it only means something if it moves with the document text:
// BUMP IT whenever either date below changes. Bumping makes hasValidConsent()
// fail for existing devices, which re-runs onboarding — that is the intended
// re-consent mechanism. One version covers both documents because one
// checkbox covers both.
export const CONSENT_VERSION = 1;

// Per-locale so month names stay translated. Typed as a full record, so
// updating one language without the other is a compile error rather than a
// silently English date in the Albanian app.
export const POLICY_LAST_UPDATED: Record<SupportedLocale, string> = {
  en: "Mar 2026",
  sq: "Mars 2026",
};
export const TERMS_LAST_UPDATED: Record<SupportedLocale, string> = {
  en: "Jul 2026",
  sq: "Korrik 2026",
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    FORGOT_PASSWORD: "/api/auth/forgot-password",
    VERIFY_RESET_CODE: "/api/auth/verify-reset-code",
    RESET_PASSWORD: "/api/auth/reset-password",
    ME: "/api/auth/me",
    VERIFY_EMAIL: "/api/auth/verify",
    RESEND_VERIFICATION: "/api/auth/resend-verification",
  },
  STORIES: "/api/stories",
  STORY: (id: string) => `/api/stories/${id}`,
  STORY_PAGES: (storyId: string) => `/api/stories/${storyId}/pages`,
  STORY_PAGE: (storyId: string, pageId: string) =>
    `/api/stories/${storyId}/pages/${pageId}`,
  REORDER_PAGES: (storyId: string) => `/api/stories/${storyId}/pages/reorder`,
  UPLOAD: "/api/upload",
} as const;

export const COLORS = {
  // Child mode — soft, calming
  child: {
    background: "#F7F5EF",
    surface: "#FFFFFF",
    primary: "#7EB8C9",
    secondary: "#B8D4BE",
    accent: "#F2C87E",
    text: "#3A3A3A",
    textLight: "#8A8A8A",
    border: "#E8E4DB",
    success: "#A8D5A2",
    locked: "#D4D0C8",
  },
  // Admin mode — clean, professional
  admin: {
    background: "#F4F6F9",
    surface: "#FFFFFF",
    primary: "#4A6FA5",
    secondary: "#6B8FBF",
    accent: "#E8913A",
    text: "#1A1A2E",
    textLight: "#6E7191",
    border: "#D9DBE9",
    success: "#4CAF50",
    danger: "#E74C3C",
  },
} as const;
