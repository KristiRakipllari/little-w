import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Emotion check-ins recorded before a child opens a story. Like reading stats,
// these stay on-device today (see privacy policy). The append-only log is
// ready for a future parent/therapist "mood pattern" view in the dashboard and
// for opt-in account sync (behind consent + an updated policy).

export type MoodId = "happy" | "okay" | "worried" | "angry";

export interface MoodEntry {
  mood: MoodId;
  storyId: string;
  at: string; // ISO timestamp
}

interface MoodState {
  moods: MoodEntry[];
  hydrated: boolean;

  recordMood: (storyId: string, mood: MoodId) => void;
  hydrate: () => Promise<void>;
  resetMoods: () => void;
}

const STORAGE_KEY = "@littleworld/moods";

// Cap the log so storage can't grow unbounded; oldest entries drop first.
const MAX_MOODS = 1000;

export const useMoodStore = create<MoodState>((set, get) => {
  const persist = () => {
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ moods: get().moods })
    ).catch(() => {});
  };

  return {
    moods: [],
    hydrated: false,

    recordMood: (storyId, mood) => {
      const entry: MoodEntry = { mood, storyId, at: new Date().toISOString() };
      set((state) => {
        const next = [...state.moods, entry];
        return {
          moods: next.length > MAX_MOODS ? next.slice(next.length - MAX_MOODS) : next,
        };
      });
      persist();
    },

    hydrate: async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          set({ moods: saved.moods || [], hydrated: true });
        } else {
          set({ hydrated: true });
        }
      } catch {
        set({ hydrated: true });
      }
    },

    resetMoods: () => {
      set({ moods: [] });
      AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    },
  };
});

// ─── Derived dashboard data ──────────────────

export interface MoodSummary {
  counts: Record<MoodId, number>; // per-mood check-ins in the last 7 days
  weekTotal: number; // total check-ins in the last 7 days
  total: number; // all-time total
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function computeMoodSummary(moods: MoodEntry[]): MoodSummary {
  const counts: Record<MoodId, number> = { happy: 0, okay: 0, worried: 0, angry: 0 };
  const since = Date.now() - WEEK_MS;
  let weekTotal = 0;
  for (const m of moods) {
    const ts = Date.parse(m.at);
    if (!Number.isNaN(ts) && ts >= since && m.mood in counts) {
      counts[m.mood] += 1;
      weekTotal += 1;
    }
  }
  return { counts, weekTotal, total: moods.length };
}
