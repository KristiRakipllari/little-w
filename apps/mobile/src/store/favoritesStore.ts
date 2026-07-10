import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Favourited stories, saved on-device only. Autistic children often re-read
// the same story dozens of times — favourites keep those stories one tap away.
interface FavoritesState {
  favoriteIds: string[];
  toggleFavorite: (storyId: string) => void;
  isFavorite: (storyId: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favoriteIds: [],

      toggleFavorite: (storyId) =>
        set((state) => ({
          favoriteIds: state.favoriteIds.includes(storyId)
            ? state.favoriteIds.filter((id) => id !== storyId)
            : [...state.favoriteIds, storyId],
        })),

      isFavorite: (storyId) => get().favoriteIds.includes(storyId),
    }),
    {
      name: "@littleworld/favorites",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
