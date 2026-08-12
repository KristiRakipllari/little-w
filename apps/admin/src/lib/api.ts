import type {
  ApiResponse,
  Story,
  StoryWithPages,
  StoryPage,
  CreateStoryRequest,
  UpdateStoryRequest,
  CreatePageRequest,
  UpdatePageRequest,
  User,
} from "@calm-stories/shared";

// All authenticated calls go through the same-origin BFF proxy, which attaches
// the JWT from the httpOnly cookie. The browser never handles the token.
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isForm = options.body instanceof FormData;
  const res = await fetch(`/api/proxy/${path}`, {
    ...options,
    headers: {
      ...(isForm ? {} : options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers as Record<string, string>),
    },
  });
  const data = (await res.json()) as ApiResponse<T>;
  if (!data.success) throw new Error(data.error || "Request failed");
  return data.data as T;
}

// ─── Session (admin's own route handler) ─────
export async function login(email: string, password: string): Promise<User> {
  const res = await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = (await res.json()) as ApiResponse<{ user: User }>;
  if (!data.success || !data.data) throw new Error(data.error || "Login failed");
  return data.data.user;
}

export async function logout(): Promise<void> {
  await fetch("/api/session", { method: "DELETE" });
}

// ─── Stories ─────────────────────────────────
export const getStories = () => request<Story[]>("stories");
export const getStory = (id: string) => request<StoryWithPages>(`stories/${id}`);
export const createStory = (body: CreateStoryRequest) =>
  request<Story>("stories", { method: "POST", body: JSON.stringify(body) });
export const updateStory = (id: string, body: UpdateStoryRequest) =>
  request<Story>(`stories/${id}`, { method: "PUT", body: JSON.stringify(body) });
export const deleteStory = (id: string) =>
  request<{ deleted: boolean }>(`stories/${id}`, { method: "DELETE" });

// ─── Pages ───────────────────────────────────
export const createPage = (storyId: string, body: CreatePageRequest) =>
  request<StoryPage>(`stories/${storyId}/pages`, {
    method: "POST",
    body: JSON.stringify(body),
  });
export const updatePage = (storyId: string, pageId: string, body: UpdatePageRequest) =>
  request<StoryPage>(`stories/${storyId}/pages/${pageId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
export const deletePage = (storyId: string, pageId: string) =>
  request<{ deleted: boolean }>(`stories/${storyId}/pages/${pageId}`, {
    method: "DELETE",
  });
export const reorderPages = (storyId: string, pageIds: string[]) =>
  request<StoryPage[]>(`stories/${storyId}/pages/reorder`, {
    method: "PUT",
    body: JSON.stringify({ page_ids: pageIds }),
  });

// ─── Upload ──────────────────────────────────
export async function uploadFile(
  file: File,
  storyId: string,
  type: "cover" | "page" | "audio_sq" | "audio_en"
): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("storyId", storyId);
  formData.append("type", type);
  return request<{ url: string }>("upload", { method: "POST", body: formData });
}
