import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

// All reading analytics stay on-device today (see privacy policy — nothing is
// sent to a server). The store is sync-ready: every change is also recorded in
// an append-only `events` log, so a future sync worker can upload pending
// events to the parent's account (behind consent + an updated policy) and a
// fresh device can rebuild these aggregates from the server. Until then the
// log is only persisted locally.

export interface ReadingEvent {
  type: "open" | "finish" | "time";
  at: string; // ISO timestamp
  storyId?: string;
  title?: string;
  seconds?: number; // only for "time"
}

export interface DayStats {
  seconds: number;
  opened: number;
  finished: number;
}

export interface StoryStats {
  title: string;
  opened: number;
  finished: number;
  lastOpenedAt: string; // ISO date
}

interface ReadingStatsState {
  days: Record<string, DayStats>; // "YYYY-MM-DD" → totals
  stories: Record<string, StoryStats>; // storyId → totals
  events: ReadingEvent[]; // pending upload queue for future account sync
  hydrated: boolean;

  recordOpen: (storyId: string, title: string) => void;
  recordFinish: (storyId: string) => void;
  addReadingTime: (storyId: string, seconds: number) => void;
  hydrate: () => Promise<void>;
  resetStats: () => void;
}

const STORAGE_KEY = "@littleworld/reading-stats";

// A single session can't credibly exceed this — guards against the app
// sitting open overnight inflating the numbers.
const MAX_SESSION_SECONDS = 60 * 60;

// Cap the pending-event log so storage can't grow unbounded before sync
// exists; oldest events drop first (aggregates keep the full picture).
const MAX_EVENTS = 1000;

function appendEvent(events: ReadingEvent[], event: ReadingEvent): ReadingEvent[] {
  const next = [...events, event];
  return next.length > MAX_EVENTS ? next.slice(next.length - MAX_EVENTS) : next;
}

export function dayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const EMPTY_DAY: DayStats = { seconds: 0, opened: 0, finished: 0 };

export const useReadingStatsStore = create<ReadingStatsState>((set, get) => {
  const persist = () => {
    const { days, stories, events } = get();
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ days, stories, events })
    ).catch(() => {});
  };

  return {
    days: {},
    stories: {},
    events: [],
    hydrated: false,

    recordOpen: (storyId, title) => {
      const key = dayKey();
      const now = new Date().toISOString();
      set((state) => {
        const day = state.days[key] || EMPTY_DAY;
        const story = state.stories[storyId] || {
          title,
          opened: 0,
          finished: 0,
          lastOpenedAt: key,
        };
        return {
          days: {
            ...state.days,
            [key]: { ...day, opened: day.opened + 1 },
          },
          stories: {
            ...state.stories,
            [storyId]: {
              ...story,
              title, // keep title fresh in case it was renamed
              opened: story.opened + 1,
              lastOpenedAt: key,
            },
          },
          events: appendEvent(state.events, {
            type: "open",
            at: now,
            storyId,
            title,
          }),
        };
      });
      persist();
    },

    recordFinish: (storyId) => {
      const key = dayKey();
      const now = new Date().toISOString();
      set((state) => {
        const day = state.days[key] || EMPTY_DAY;
        const story = state.stories[storyId];
        return {
          days: {
            ...state.days,
            [key]: { ...day, finished: day.finished + 1 },
          },
          stories: story
            ? {
                ...state.stories,
                [storyId]: { ...story, finished: story.finished + 1 },
              }
            : state.stories,
          events: appendEvent(state.events, {
            type: "finish",
            at: now,
            storyId,
          }),
        };
      });
      persist();
    },

    addReadingTime: (storyId, seconds) => {
      const clamped = Math.min(Math.max(0, Math.round(seconds)), MAX_SESSION_SECONDS);
      if (clamped === 0) return;
      const key = dayKey();
      const now = new Date().toISOString();
      set((state) => {
        const day = state.days[key] || EMPTY_DAY;
        return {
          days: {
            ...state.days,
            [key]: { ...day, seconds: day.seconds + clamped },
          },
          events: appendEvent(state.events, {
            type: "time",
            at: now,
            storyId,
            seconds: clamped,
          }),
        };
      });
      persist();
    },

    hydrate: async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          set({
            days: saved.days || {},
            stories: saved.stories || {},
            events: saved.events || [],
            hydrated: true,
          });
        } else {
          set({ hydrated: true });
        }
      } catch {
        set({ hydrated: true });
      }
    },

    resetStats: () => {
      set({ days: {}, stories: {}, events: [] });
      AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    },
  };
});

// ─── Derived dashboard data ──────────────────

export interface DashboardData {
  week: number[]; // minutes per day, oldest → today
  weekDates: Date[]; // matching dates for day labels
  todayIdx: number;
  streak: number;
  storiesRead: number; // finished in the last 7 days
  calmMinutes: number; // minutes in the last 7 days
  weeklyDelta: number; // % change vs the 7 days before
  favorite: { storyId: string; title: string; opened: number; finished: number } | null;
}

export function computeDashboard(
  days: Record<string, DayStats>,
  stories: Record<string, StoryStats>
): DashboardData {
  const today = new Date();

  const minutesOn = (d: Date) => {
    const stats = days[dayKey(d)];
    return stats ? stats.seconds / 60 : 0;
  };

  const daysAgo = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - n);
    return d;
  };

  // Last 7 calendar days, oldest first, today last
  const weekDates = Array.from({ length: 7 }, (_, i) => daysAgo(6 - i));
  const week = weekDates.map((d) => Math.round(minutesOn(d)));

  let thisWeekMin = 0;
  let prevWeekMin = 0;
  let storiesRead = 0;
  for (let i = 0; i < 7; i++) {
    thisWeekMin += minutesOn(daysAgo(i));
    prevWeekMin += minutesOn(daysAgo(i + 7));
    storiesRead += days[dayKey(daysAgo(i))]?.finished || 0;
  }

  const weeklyDelta =
    prevWeekMin > 0
      ? Math.round(((thisWeekMin - prevWeekMin) / prevWeekMin) * 100)
      : 0;

  // Streak: consecutive days with reading, ending today (or yesterday, so the
  // streak isn't shown as broken before today's reading happens).
  // Hard cap bounds the loop against any pathological stored data.
  const MAX_STREAK_DAYS = 400;
  let streak = 0;
  const start = minutesOn(today) > 0 ? 0 : 1;
  for (let i = start; i < start + MAX_STREAK_DAYS; i++) {
    if (minutesOn(daysAgo(i)) > 0) streak++;
    else break;
  }

  // Favorite: most-opened story
  let favorite: DashboardData["favorite"] = null;
  for (const [storyId, s] of Object.entries(stories)) {
    if (!favorite || s.opened > favorite.opened) {
      favorite = { storyId, title: s.title, opened: s.opened, finished: s.finished };
    }
  }

  return {
    week,
    weekDates,
    todayIdx: 6,
    streak,
    storiesRead,
    calmMinutes: Math.round(thisWeekMin),
    weeklyDelta,
    favorite,
  };
}
