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
  isSubscribed: boolean;

  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  register: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  loadSession: () => Promise<void>;
  setMode: (mode: AppMode) => void;
  clearError: () => void;
}

const STORAGE_KEYS = {
  ...CONFIG.STORAGE_KEYS,
  PARENT_TOKEN: "calm_parent_token",
  PARENT_EMAIL: "calm_parent_email",
  IS_SUBSCRIBED: "calm_is_subscribed",
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  mode: "child",
  isLoading: false,
  error: null,
  isSubscribed: false,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const result = await api.login(credentials);
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, result.access_token);
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_DATA,
        JSON.stringify(result.user)
      );
      await AsyncStorage.setItem(STORAGE_KEYS.PARENT_TOKEN, result.access_token);
      await AsyncStorage.setItem(STORAGE_KEYS.PARENT_EMAIL, result.user.email);

      // TODO: Replace with RevenueCat check in Phase 4
      const subscribed = result.user.email === "premium@littleworld.app";
      await AsyncStorage.setItem(STORAGE_KEYS.IS_SUBSCRIBED, String(subscribed));

      const isAdmin = result.user.role === "admin" || result.user.role === "editor";
      set({
        user: result.user,
        token: result.access_token,
        isSubscribed: subscribed,
        mode: isAdmin && get().mode === "admin" ? "admin" : get().mode,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  register: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const result = await api.register(credentials);
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, result.access_token);
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_DATA,
        JSON.stringify(result.user)
      );
      await AsyncStorage.setItem(STORAGE_KEYS.PARENT_TOKEN, result.access_token);
      await AsyncStorage.setItem(STORAGE_KEYS.PARENT_EMAIL, result.user.email);

      set({
        user: result.user,
        token: result.access_token,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  logout: async () => {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.USER_DATA,
      STORAGE_KEYS.PARENT_TOKEN,
      STORAGE_KEYS.PARENT_EMAIL,
      STORAGE_KEYS.IS_SUBSCRIBED,
    ]);
    set({ user: null, token: null, mode: "child", error: null, isSubscribed: false });
  },

  loadSession: async () => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      const savedMode = await AsyncStorage.getItem(STORAGE_KEYS.APP_MODE);
      const subscribed = await AsyncStorage.getItem(STORAGE_KEYS.IS_SUBSCRIBED);

      if (token && userData) {
        set({
          token,
          user: JSON.parse(userData),
          mode: (savedMode as AppMode) || "child",
          isSubscribed: subscribed === "true",
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
    AsyncStorage.setItem(STORAGE_KEYS.APP_MODE, mode);
    set({ mode });
  },

  clearError: () => set({ error: null }),
}));
