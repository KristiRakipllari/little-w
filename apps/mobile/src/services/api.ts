import { CONFIG } from "@/config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  ApiResponse,
  Story,
  StoryWithPages,
  StoryPage,
  CreateStoryRequest,
  UpdateStoryRequest,
  CreatePageRequest,
  UpdatePageRequest,
  AuthTokens,
  LoginRequest,
} from "@calm-stories/shared";
import { API_ENDPOINTS } from "@calm-stories/shared";

// ─── Session expiry ──────────────────────────

// Registered by authStore so a 401 on an authenticated call clears the stored
// session (expired/invalid token) instead of failing silently forever.
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

async function request<T>(
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

// ─── Auth ────────────────────────────────────

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

// ─── Stories ─────────────────────────────────

export async function getStories(level?: string): Promise<Story[]> {
  const query = level ? `?level=${level}` : "";
  const res = await request<Story[]>(`${API_ENDPOINTS.STORIES}${query}`);
  return res.data!;
}

export async function getStory(id: string): Promise<StoryWithPages> {
  const res = await request<StoryWithPages>(API_ENDPOINTS.STORY(id));
  return res.data!;
}

export async function createStory(body: CreateStoryRequest): Promise<Story> {
  const res = await request<Story>(API_ENDPOINTS.STORIES, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.data!;
}

export async function updateStory(
  id: string,
  body: UpdateStoryRequest
): Promise<Story> {
  const res = await request<Story>(API_ENDPOINTS.STORY(id), {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return res.data!;
}

export async function deleteStory(id: string): Promise<void> {
  await request(API_ENDPOINTS.STORY(id), { method: "DELETE" });
}

// ─── Pages ───────────────────────────────────

export async function getPages(storyId: string): Promise<StoryPage[]> {
  const res = await request<StoryPage[]>(API_ENDPOINTS.STORY_PAGES(storyId));
  return res.data!;
}

export async function createPage(
  storyId: string,
  body: CreatePageRequest
): Promise<StoryPage> {
  const res = await request<StoryPage>(API_ENDPOINTS.STORY_PAGES(storyId), {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.data!;
}

export async function updatePage(
  storyId: string,
  pageId: string,
  body: UpdatePageRequest
): Promise<StoryPage> {
  const res = await request<StoryPage>(
    API_ENDPOINTS.STORY_PAGE(storyId, pageId),
    { method: "PUT", body: JSON.stringify(body) }
  );
  return res.data!;
}

export async function deletePage(
  storyId: string,
  pageId: string
): Promise<void> {
  await request(API_ENDPOINTS.STORY_PAGE(storyId, pageId), {
    method: "DELETE",
  });
}

export async function reorderPages(
  storyId: string,
  pageIds: string[]
): Promise<StoryPage[]> {
  const res = await request<StoryPage[]>(
    API_ENDPOINTS.REORDER_PAGES(storyId),
    { method: "PUT", body: JSON.stringify({ page_ids: pageIds }) }
  );
  return res.data!;
}

// ─── Upload ──────────────────────────────────

export async function uploadFile(
  uri: string,
  filename: string,
  mimeType: string,
  storyId: string,
  type: string = "page"
): Promise<string> {
  const token = await AsyncStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);

  // Convert file URI to a Blob with the correct MIME type
  const fileResponse = await fetch(uri);
  const rawBlob = await fileResponse.blob();
  const file = new File([rawBlob], filename, { type: mimeType });

  const formData = new FormData();
  formData.append("file", file);
  formData.append("storyId", storyId);
  formData.append("type", type);

  const res = await fetch(`${CONFIG.API_URL}${API_ENDPOINTS.UPLOAD}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (res.status === 401) {
    onUnauthorized?.();
  }

  const data = await res.json();
  if (!data.success) throw new Error(data.error || "Upload failed");
  return data.data.url;
}

export async function deleteUploadedFile(fileUrl: string): Promise<void> {
  const token = await AsyncStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);

  const res = await fetch(`${CONFIG.API_URL}${API_ENDPOINTS.UPLOAD}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ path: fileUrl }),
  });

  if (res.status === 401) {
    onUnauthorized?.();
  }

  const data = await res.json();
  if (!data.success) throw new Error(data.error || "Delete failed");
}
