const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_token");
}

export function setToken(token: string) {
  localStorage.setItem("admin_token", token);
}

export function clearToken() {
  localStorage.removeItem("admin_token");
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  const data = await res.json();

  if (!data.success) throw new Error(data.error || "Request failed");
  return data.data;
}

// Auth
export async function login(email: string, password: string) {
  const data = await request<{ access_token: string; user: any }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setToken(data.access_token);
  localStorage.setItem("admin_user", JSON.stringify(data.user));
  return data;
}

export function logout() {
  clearToken();
  localStorage.removeItem("admin_user");
}

export function getUser() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("admin_user");
  return raw ? JSON.parse(raw) : null;
}

export function isAuthenticated() {
  return !!getToken();
}

// Stories
export function getStories() {
  return request<any[]>("/api/stories");
}

export function getStory(id: string) {
  return request<any>(`/api/stories/${id}`);
}

export function createStory(body: any) {
  return request<any>("/api/stories", { method: "POST", body: JSON.stringify(body) });
}

export function updateStory(id: string, body: any) {
  return request<any>(`/api/stories/${id}`, { method: "PUT", body: JSON.stringify(body) });
}

export function deleteStory(id: string) {
  return request<any>(`/api/stories/${id}`, { method: "DELETE" });
}

// Pages
export function createPage(storyId: string, body: any) {
  return request<any>(`/api/stories/${storyId}/pages`, { method: "POST", body: JSON.stringify(body) });
}

export function updatePage(storyId: string, pageId: string, body: any) {
  return request<any>(`/api/stories/${storyId}/pages/${pageId}`, { method: "PUT", body: JSON.stringify(body) });
}

export function deletePage(storyId: string, pageId: string) {
  return request<any>(`/api/stories/${storyId}/pages/${pageId}`, { method: "DELETE" });
}

// Upload
export async function uploadFile(file: File, type: "image" | "audio", language?: string) {
  const token = getToken();
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/api/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}
