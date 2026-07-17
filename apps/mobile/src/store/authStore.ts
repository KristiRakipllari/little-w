import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CONFIG } from "@/config";
import * as api from "@/services/api";
import * as purchases from "@/services/purchases";
import type { User, LoginRequest } from "@calm-stories/shared";

type AppMode = "child" | "admin";

interface AuthState {
  user: User | null;
  token: string | null;
  mode: AppMode;
  isLoading: boolean;
  error: string | null;
  isSubscribed: boolean;
  hydrated: boolean;
  // True once the account's free week has been consumed (7-day session
  // expired). Survives logout so the paywall can stop offering the trial.
  trialUsed: boolean;

  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  register: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  loadSession: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  setMode: (mode: AppMode) => void;
  markTrialUsed: () => void;
  clearError: () => void;
}

const STORAGE_KEYS = {
  ...CONFIG.STORAGE_KEYS,
  PARENT_TOKEN: "calm_parent_token",
  PARENT_EMAIL: "calm_parent_email",
  IS_SUBSCRIBED: "calm_is_subscribed",
  TRIAL_USED: "calm_trial_used",
};

// Minimal base64 decoder — Hermes has no atob().
const B64_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
function decodeBase64(input: string): string {
  const str = input.replace(/=+$/, "");
  let output = "";
  for (let bc = 0, bs = 0, i = 0; i < str.length; i++) {
    const buffer = B64_CHARS.indexOf(str.charAt(i));
    if (buffer === -1) continue;
    bs = bc % 4 ? bs * 64 + buffer : buffer;
    if (bc++ % 4) output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)));
  }
  return output;
}

// Mirrors the API's hasActiveEntitlement: the webhook-synced subscription on
// the user record counts as premium too. This keeps subscribed users premium
// on platforms where the RevenueCat SDK can't run (web, Expo Go) and rides
// out transient RevenueCat outages.
function hasServerEntitlement(user: User | null): boolean {
  if (!user?.entitlement) return false;
  if (!user.entitlement_expires_at) return true;
  return new Date(user.entitlement_expires_at).getTime() > Date.now();
}

// Reads the JWT's exp claim without verifying the signature — enough to know
// locally that the 7-day session is over before the API rejects it.
function isTokenExpired(token: string): boolean {
  try {
    const payload = token.split(".")[1];
    const json = decodeBase64(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const { exp } = JSON.parse(json);
    return typeof exp === "number" && exp * 1000 <= Date.now();
  } catch {
    // Fail closed: a token we can't decode is a token we can't trust —
    // treat it as expired so the corrupt session drops to free mode now
    // instead of lingering until the next 401.
    return true;
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  mode: "child",
  isLoading: false,
  error: null,
  isSubscribed: false,
  hydrated: false,
  trialUsed: false,

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

      // Log in instantly with the entitlement the server already knows;
      // attaching the RevenueCat identity is a network call, so it runs in
      // the background and refreshSubscription corrects state if it differs.
      const subscribed = hasServerEntitlement(result.user);
      await AsyncStorage.setItem(STORAGE_KEYS.IS_SUBSCRIBED, String(subscribed));
      purchases
        .logInPurchases(result.user.id)
        .then(() => get().refreshSubscription())
        .catch(() => {});

      // The server tracks trial consumption per account, so it survives
      // reinstalls and cleared data — its answer overrides the local cache.
      const trialUsed = result.user.trial_used === true;
      await AsyncStorage.setItem(STORAGE_KEYS.TRIAL_USED, String(trialUsed));

      const isAdmin = result.user.role === "admin" || result.user.role === "editor";
      set({
        user: result.user,
        token: result.access_token,
        isSubscribed: subscribed,
        trialUsed,
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

      // Same non-blocking pattern as login(): brand-new accounts are never
      // premium, so there's nothing to wait for.
      const subscribed = hasServerEntitlement(result.user);
      await AsyncStorage.setItem(STORAGE_KEYS.IS_SUBSCRIBED, String(subscribed));
      purchases
        .logInPurchases(result.user.id)
        .then(() => get().refreshSubscription())
        .catch(() => {});

      const trialUsed = result.user.trial_used === true;
      await AsyncStorage.setItem(STORAGE_KEYS.TRIAL_USED, String(trialUsed));

      set({
        user: result.user,
        token: result.access_token,
        isSubscribed: subscribed,
        trialUsed,
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
    // Detach the RevenueCat identity too (back to an anonymous customer).
    await purchases.logOutPurchases();
    set({ user: null, token: null, mode: "child", error: null, isSubscribed: false });
  },

  loadSession: async () => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      const savedMode = await AsyncStorage.getItem(STORAGE_KEYS.APP_MODE);
      const subscribed = await AsyncStorage.getItem(STORAGE_KEYS.IS_SUBSCRIBED);
      const trialUsed =
        (await AsyncStorage.getItem(STORAGE_KEYS.TRIAL_USED)) === "true";

      if (token && userData) {
        if (isTokenExpired(token)) {
          // The 7-day session ended while the app was closed: the free week
          // is consumed, drop back to logged-out free mode.
          get().markTrialUsed();
          await get().logout();
          set({ isLoading: false, hydrated: true });
          return;
        }
        const user: User = JSON.parse(userData);
        set({
          token,
          user,
          mode: (savedMode as AppMode) || "child",
          // Cached value for instant UI; refreshed from RevenueCat below.
          isSubscribed: subscribed === "true" || hasServerEntitlement(user),
          trialUsed,
          isLoading: false,
          hydrated: true,
        });
        // Re-attach the RevenueCat identity, then pull the live entitlement
        // state in the background (renewals/cancellations while closed).
        purchases
          .logInPurchases(user.id)
          .then(() => get().refreshSubscription())
          .catch(() => {});
      } else {
        set({ trialUsed, isLoading: false, hydrated: true });
      }
    } catch {
      set({ isLoading: false, hydrated: true });
    }
  },

  refreshSubscription: async () => {
    const customerInfo = await purchases.getCustomerInfo();
    if (!customerInfo) return; // unsupported platform or offline — keep cache
    const subscribed =
      purchases.hasPremium(customerInfo) || hasServerEntitlement(get().user);
    await AsyncStorage.setItem(STORAGE_KEYS.IS_SUBSCRIBED, String(subscribed));
    set({ isSubscribed: subscribed });
  },

  setMode: (mode) => {
    AsyncStorage.setItem(STORAGE_KEYS.APP_MODE, mode);
    set({ mode });
  },

  markTrialUsed: () => {
    AsyncStorage.setItem(STORAGE_KEYS.TRIAL_USED, "true");
    set({ trialUsed: true });
  },

  clearError: () => set({ error: null }),
}));

// A 401 from an authenticated endpoint means the stored token is expired or
// invalid — the free week is over. Consume the trial and clear the session
// so the UI doesn't keep a ghost login around.
api.setUnauthorizedHandler(() => {
  const { markTrialUsed, logout } = useAuthStore.getState();
  markTrialUsed();
  logout();
});

// Keeps isSubscribed in sync with RevenueCat pushes (purchase, restore,
// renewal, expiration). Must run AFTER configurePurchases() — App.tsx calls
// it once at startup.
let purchasesSyncAttached = false;
export function attachPurchasesSync(): void {
  if (purchasesSyncAttached) return;
  purchasesSyncAttached = true;
  purchases.addCustomerInfoListener((info) => {
    const subscribed =
      purchases.hasPremium(info) ||
      hasServerEntitlement(useAuthStore.getState().user);
    AsyncStorage.setItem(STORAGE_KEYS.IS_SUBSCRIBED, String(subscribed)).catch(
      () => {}
    );
    useAuthStore.setState({ isSubscribed: subscribed });
  });
}
