import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as api from "@/services/api";
import type {
  Story,
  StoryWithPages,
  StoryPage,
  CreateStoryRequest,
  UpdateStoryRequest,
  CreatePageRequest,
  UpdatePageRequest,
} from "@calm-stories/shared";

interface StoryState {
  stories: Story[];
  currentStory: StoryWithPages | null;
  isLoading: boolean;
  error: string | null;
  // When the unfiltered story list was last fetched from the API (ms epoch).
  lastFetched: number | null;

  // Story actions
  fetchStories: (level?: string) => Promise<void>;
  fetchStory: (id: string) => Promise<void>;
  createStory: (data: CreateStoryRequest) => Promise<Story>;
  updateStory: (id: string, data: UpdateStoryRequest) => Promise<void>;
  deleteStory: (id: string) => Promise<void>;

  // Page actions
  addPage: (storyId: string, data: CreatePageRequest) => Promise<void>;
  updatePage: (storyId: string, pageId: string, data: UpdatePageRequest) => Promise<void>;
  deletePage: (storyId: string, pageId: string) => Promise<void>;
  reorderPages: (storyId: string, pageIds: string[]) => Promise<void>;

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
    const { stories, lastFetched } = get();
    const hasCache = stories.length > 0;

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
      const fresh = await api.getStories(level);
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
      const story = await api.getStory(id);
      set({ currentStory: story, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  createStory: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const story = await api.createStory(data);
      set((state) => ({
        stories: [story, ...state.stories],
        isLoading: false,
      }));
      return story;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  updateStory: async (id, data) => {
    set({ error: null });
    try {
      const updated = await api.updateStory(id, data);
      set((state) => ({
        stories: state.stories.map((s) => (s.id === id ? updated : s)),
        currentStory:
          state.currentStory?.id === id
            ? { ...state.currentStory, ...updated }
            : state.currentStory,
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  deleteStory: async (id) => {
    set({ error: null });
    try {
      await api.deleteStory(id);
      set((state) => ({
        stories: state.stories.filter((s) => s.id !== id),
        currentStory: state.currentStory?.id === id ? null : state.currentStory,
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  addPage: async (storyId, data) => {
    try {
      const page = await api.createPage(storyId, data);
      set((state) => {
        if (state.currentStory?.id !== storyId) return state;
        return {
          currentStory: {
            ...state.currentStory,
            pages: [...state.currentStory.pages, page],
            page_count: state.currentStory.page_count + 1,
          },
        };
      });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  updatePage: async (storyId, pageId, data) => {
    try {
      const updated = await api.updatePage(storyId, pageId, data);
      set((state) => {
        if (state.currentStory?.id !== storyId) return state;
        return {
          currentStory: {
            ...state.currentStory,
            pages: state.currentStory.pages.map((p) =>
              p.id === pageId ? updated : p
            ),
          },
        };
      });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  deletePage: async (storyId, pageId) => {
    try {
      await api.deletePage(storyId, pageId);
      set((state) => {
        if (state.currentStory?.id !== storyId) return state;
        return {
          currentStory: {
            ...state.currentStory,
            pages: state.currentStory.pages.filter((p) => p.id !== pageId),
            page_count: state.currentStory.page_count - 1,
          },
        };
      });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  reorderPages: async (storyId, pageIds) => {
    try {
      const pages = await api.reorderPages(storyId, pageIds);
      set((state) => {
        if (state.currentStory?.id !== storyId) return state;
        return {
          currentStory: { ...state.currentStory, pages },
        };
      });
    } catch (err: any) {
      set({ error: err.message });
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
