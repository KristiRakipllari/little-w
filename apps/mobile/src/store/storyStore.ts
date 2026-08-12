import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as stories from "@/services/stories";
import type { Story, StoryWithPages } from "@calm-stories/shared";

interface StoryState {
  stories: Story[];
  currentStory: StoryWithPages | null;
  isLoading: boolean;
  error: string | null;
  // When the unfiltered story list was last fetched from the API (ms epoch).
  lastFetched: number | null;

  fetchStories: (level?: string) => Promise<void>;
  fetchStory: (id: string) => Promise<void>;

  clearError: () => void;
  clearCurrentStory: () => void;
}

// Cached stories are considered fresh for this long; within the window the
// list renders straight from AsyncStorage without hitting the API.
const STORIES_CACHE_TTL_MS = 5 * 60 * 1000;

export const useStoryStore = create<StoryState>()(
  persist(
    (set, get) => ({
  stories: [],
  currentStory: null,
  isLoading: false,
  error: null,
  lastFetched: null,

  fetchStories: async (level) => {
    const { stories: cached, lastFetched } = get();
    const hasCache = cached.length > 0;

    // Only the unfiltered list is cached; a level-filtered request always
    // goes to the API.
    if (
      !level &&
      hasCache &&
      lastFetched !== null &&
      Date.now() - lastFetched < STORIES_CACHE_TTL_MS
    ) {
      return;
    }

    // Returning users see cached stories immediately — the spinner only
    // shows on a truly empty first load, and the refresh runs silently.
    if (!hasCache) set({ isLoading: true, error: null });
    try {
      const fresh = await stories.getStories(level);
      set({
        stories: fresh,
        isLoading: false,
        error: null,
        ...(level ? {} : { lastFetched: Date.now() }),
      });
    } catch (err: any) {
      // Offline / failed refresh with cached data: keep showing the cache
      // and swallow the error so nothing crashes or flashes.
      if (hasCache) set({ isLoading: false });
      else set({ error: err.message, isLoading: false });
    }
  },

  fetchStory: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const story = await stories.getStory(id);
      set({ currentStory: story, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
  clearCurrentStory: () => set({ currentStory: null }),
    }),
    {
      name: "@littleworld/stories",
      storage: createJSONStorage(() => AsyncStorage),
      // Persist only the list cache — never loading/error flags or the
      // currently open story.
      partialize: (state) => ({
        stories: state.stories,
        lastFetched: state.lastFetched,
      }),
    }
  )
);
