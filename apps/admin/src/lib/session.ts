import "server-only";
import { cookies } from "next/headers";
import type { UserRole } from "@calm-stories/shared";

// httpOnly cookie holding the API JWT. The browser never sees the token; all
// authenticated calls go through the admin's own BFF proxy (app/api/proxy),
// which reads this cookie server-side and attaches the Bearer header.
export const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME || "lw_session";

export interface SessionUser {
  id: string;
  email: string;
  role: UserRole;
}

export async function getSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

// Decode (not verify) the JWT payload for display only — the API still verifies
// the signature on every request, so this is safe for rendering the sidebar.
export async function getSessionUser(): Promise<SessionUser | null> {
  const token = await getSessionToken();
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const json = Buffer.from(
      payload.replace(/-/g, "+").replace(/_/g, "/"),
      "base64"
    ).toString("utf-8");
    const data = JSON.parse(json) as SessionUser;
    if (!data?.id || !data?.email) return null;
    return { id: data.id, email: data.email, role: data.role };
  } catch {
    return null;
  }
}
