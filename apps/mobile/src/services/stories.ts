import type { Story, StoryWithPages } from "@calm-stories/shared";
import { API_ENDPOINTS } from "@calm-stories/shared";
import { request } from "./client";

// ─── Public story reads ──────────────────────

export async function getStories(level?: string): Promise<Story[]> {
  const query = level ? `?level=${level}` : "";
  const res = await request<Story[]>(`${API_ENDPOINTS.STORIES}${query}`);
  return res.data!;
}

export async function getStory(id: string): Promise<StoryWithPages> {
  const res = await request<StoryWithPages>(API_ENDPOINTS.STORY(id));
  return res.data!;
}
