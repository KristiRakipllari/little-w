import { create } from "zustand";
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

export const useStoryStore = create<StoryState>((set, get) => ({
  stories: [],
  currentStory: null,
  isLoading: false,
  error: null,

  fetchStories: async (level) => {
    set({ isLoading: true, error: null });
    try {
      const stories = await api.getStories(level);
      set({ stories, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
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
}));
