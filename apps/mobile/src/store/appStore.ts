import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_THEME_ID } from "@calm-stories/shared";

export type AgeChoice = "child" | "adult" | null;
export type TextSize = "s" | "m" | "l";
export type MotionPref = "slow" | "normal" | "off";
export type Locale = "sq" | "en";

// Bump this whenever the Privacy Policy / Terms / consent copy changes in a way
// that requires users to review and re-accept. Onboarding re-runs when the
// stored consent version is older than this.
export const CONSENT_VERSION = 1;

export interface ConsentData {
  version: number;
  acceptedAt: string; // ISO timestamp
  guardianConfirmed: boolean;
}

// Consent is valid only when it exists and matches the current version.
export function hasValidConsent(consent: ConsentData | null): boolean {
  return !!consent && consent.version >= CONSENT_VERSION;
}

interface AppState {
  // Onboarding
  ageChoice: AgeChoice;
  agreed: boolean;
  consentData: ConsentData | null;
  hydrated: boolean;

  // Reading progress (most recently opened story)
  lastReadStoryId: string | null;
  lastReadPage: number;
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
  acceptConsent: (guardianConfirmed: boolean) => void;
  setLastRead: (storyId: string, page: number) => void;
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
  consentData: null as ConsentData | null,
  lastReadStoryId: null as string | null,
  lastReadPage: 1,
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
  acceptConsent: (guardianConfirmed) => {
    const consentData: ConsentData = {
      version: CONSENT_VERSION,
      acceptedAt: new Date().toISOString(),
      guardianConfirmed,
    };
    // Keep `agreed` in sync for any legacy checks.
    set({ consentData, agreed: true });
    persist({ consentData, agreed: true });
  },
  setLastRead: (storyId, page) => {
    set({ lastReadStoryId: storyId, lastReadPage: page });
    persist({ lastReadStoryId: storyId, lastReadPage: page });
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
