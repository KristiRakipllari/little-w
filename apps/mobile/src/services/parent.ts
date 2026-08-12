import type { AuthTokens, LoginRequest } from "@calm-stories/shared";
import { API_ENDPOINTS } from "@calm-stories/shared";
import { request } from "./client";

// ─── Parent auth ─────────────────────────────

export async function login(body: LoginRequest): Promise<AuthTokens> {
  const res = await request<AuthTokens>(API_ENDPOINTS.AUTH.LOGIN, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.data!;
}

export async function register(body: LoginRequest): Promise<AuthTokens> {
  // No display name collected in the app — the API defaults it server-side.
  const res = await request<AuthTokens>(API_ENDPOINTS.AUTH.REGISTER, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.data!;
}

// ─── Password reset ──────────────────────────

export async function forgotPassword(email: string): Promise<void> {
  await request(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

// Checks the code without consuming it — lets the UI advance to the password
// step only once the code is confirmed. Throws if the code is wrong/expired.
export async function verifyResetCode(email: string, code: string): Promise<void> {
  await request(API_ENDPOINTS.AUTH.VERIFY_RESET_CODE, {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
}

export async function resetPassword(body: {
  email: string;
  code: string;
  password: string;
}): Promise<void> {
  await request(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
