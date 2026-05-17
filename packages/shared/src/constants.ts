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

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
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
