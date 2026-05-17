import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_THEME_ID } from "@calm-stories/shared";

export type AgeChoice = "child" | "adult" | null;
export type TextSize = "s" | "m" | "l";
export type MotionPref = "slow" | "normal" | "off";
export type Locale = "sq" | "en";

interface AppState {
  // Onboarding
  ageChoice: AgeChoice;
  agreed: boolean;
  hydrated: boolean;

  // Active story
  currentStory: string | null;
  currentPage: number;
  paywallStory: string | null;

  // Parent gate
  parentEmail: string;

  // Settings
  locale: Locale;
  themeId: string;
  audio: boolean;
  textSize: TextSize;
  motion: MotionPref;

  // Actions
  setAgeChoice: (choice: AgeChoice) => void;
  setAgreed: (agreed: boolean) => void;
  setCurrentStory: (storyId: string | null, page?: number) => void;
  setCurrentPage: (page: number) => void;
  setPaywallStory: (storyId: string | null) => void;
  setParentEmail: (email: string) => void;
  setLocale: (locale: Locale) => void;
  setThemeId: (id: string) => void;
  setAudio: (on: boolean) => void;
  setTextSize: (size: TextSize) => void;
  setMotion: (pref: MotionPref) => void;
  reset: () => void;
  hydrate: () => Promise<void>;
}

const STORAGE_KEY = "@littleworld/app";

const DEFAULTS = {
  ageChoice: null as AgeChoice,
  agreed: false,
  currentStory: null as string | null,
  currentPage: 1,
  paywallStory: null as string | null,
  parentEmail: "",
  locale: "sq" as Locale,
  themeId: DEFAULT_THEME_ID,
  audio: true,
  textSize: "m" as TextSize,
  motion: "normal" as MotionPref,
};

function persist(partial: Partial<typeof DEFAULTS>) {
  AsyncStorage.mergeItem(STORAGE_KEY, JSON.stringify(partial)).catch(() => {});
}

export const useAppStore = create<AppState>((set) => ({
  ...DEFAULTS,
  hydrated: false,

  setAgeChoice: (ageChoice) => {
    set({ ageChoice });
    persist({ ageChoice });
  },
  setAgreed: (agreed) => {
    set({ agreed });
    persist({ agreed });
  },
  setCurrentStory: (storyId, page = 1) => {
    set({ currentStory: storyId, currentPage: page });
  },
  setCurrentPage: (currentPage) => {
    set({ currentPage });
  },
  setPaywallStory: (paywallStory) => {
    set({ paywallStory });
  },
  setParentEmail: (parentEmail) => {
    set({ parentEmail });
  },
  setLocale: (locale) => {
    set({ locale });
    persist({ locale });
  },
  setThemeId: (themeId) => {
    set({ themeId });
    persist({ themeId });
  },
  setAudio: (audio) => {
    set({ audio });
    persist({ audio });
  },
  setTextSize: (textSize) => {
    set({ textSize });
    persist({ textSize });
  },
  setMotion: (motion) => {
    set({ motion });
    persist({ motion });
  },
  reset: () => {
    set({ ...DEFAULTS, hydrated: true });
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  },
  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        set({ ...saved, hydrated: true });
      } else {
        set({ hydrated: true });
      }
    } catch {
      set({ hydrated: true });
    }
  },
}));
