import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CONFIG } from "@/config";
import * as api from "@/services/api";
import type { User, LoginRequest } from "@calm-stories/shared";

type AppMode = "child" | "admin";

interface AuthState {
  user: User | null;
  token: string | null;
  mode: AppMode;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  loadSession: () => Promise<void>;
  setMode: (mode: AppMode) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  mode: "child",
  isLoading: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const result = await api.login(credentials);
      await AsyncStorage.setItem(
        CONFIG.STORAGE_KEYS.AUTH_TOKEN,
        result.access_token
      );
      await AsyncStorage.setItem(
        CONFIG.STORAGE_KEYS.USER_DATA,
        JSON.stringify(result.user)
      );
      set({
        user: result.user,
        token: result.access_token,
        mode: "admin",
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  logout: async () => {
    await AsyncStorage.multiRemove([
      CONFIG.STORAGE_KEYS.AUTH_TOKEN,
      CONFIG.STORAGE_KEYS.USER_DATA,
    ]);
    set({ user: null, token: null, mode: "child", error: null });
  },

  loadSession: async () => {
    try {
      const token = await AsyncStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
      const userData = await AsyncStorage.getItem(CONFIG.STORAGE_KEYS.USER_DATA);
      const savedMode = await AsyncStorage.getItem(CONFIG.STORAGE_KEYS.APP_MODE);

      if (token && userData) {
        set({
          token,
          user: JSON.parse(userData),
          mode: (savedMode as AppMode) || "admin",
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  setMode: (mode) => {
    AsyncStorage.setItem(CONFIG.STORAGE_KEYS.APP_MODE, mode);
    set({ mode });
  },

  clearError: () => set({ error: null }),
}));
