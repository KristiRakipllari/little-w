import { CONFIG } from "@/config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ApiResponse } from "@calm-stories/shared";
import { API_ENDPOINTS } from "@calm-stories/shared";

// ─── Session expiry ──────────────────────────

// Registered by parentStore so a 401 on an authenticated call clears the
// stored session (expired/invalid token) instead of failing silently forever.
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler;
}

// Login/register also return 401 (bad credentials) — that must not wipe the
// session of whoever is currently logged in.
const AUTH_ENDPOINTS: string[] = [
  API_ENDPOINTS.AUTH.LOGIN,
  API_ENDPOINTS.AUTH.REGISTER,
];

// ─── Base fetch wrapper ──────────────────────

export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = await AsyncStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${CONFIG.API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401 && token && !AUTH_ENDPOINTS.includes(endpoint)) {
    onUnauthorized?.();
  }

  const data: ApiResponse<T> = await res.json();

  if (!data.success) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}
