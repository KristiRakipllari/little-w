import { NextRequest } from "next/server";
import { query, queryOne } from "@calm-stories/db";
import { getAuthUser, requireAuth } from "@/app/lib/auth";
import { success, created, error, unauthorized, serverError } from "@/app/lib/response";
import type { Story, CreateStoryRequest } from "@calm-stories/shared";

// GET /api/stories — list all stories
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    const { searchParams } = new URL(req.url);
    const level = searchParams.get("level");
    const published = searchParams.get("published");

    let sql = `
      SELECT s.*,
        (SELECT COUNT(*) FROM story_pages WHERE story_id = s.id)::int AS page_count
      FROM stories s
    `;
    const params: any[] = [];
    const conditions: string[] = [];

    // Non-admin users only see published stories
    if (!user || user.role === "editor") {
      // Editors see all, but non-auth users only see published
      if (!user) {
        conditions.push("s.is_published = true");
      }
    }

    if (level) {
      params.push(level);
      conditions.push(`s.level = $${params.length}`);
    }

    if (published !== null && user) {
      params.push(published === "true");
      conditions.push(`s.is_published = $${params.length}`);
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }

    sql += " ORDER BY s.created_at DESC";

    const stories = await query<Story>(sql, params);
    return success(stories);
  } catch (err) {
    return serverError(err);
  }
}

// POST /api/stories — create new story
export async function POST(req: NextRequest) {
  try {
    let user;
    try {
      user = await requireAuth(req);
    } catch {
      return unauthorized();
    }

    const body: CreateStoryRequest = await req.json();

    if (!body.title) {
      return error("Title is required");
    }

    const story = await queryOne<Story>(
      `INSERT INTO stories (title, description, level, is_premium, cover_image_url, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *, 0 AS page_count`,
      [
        body.title,
        body.description || "",
        body.level || "beginner",
        body.is_premium || false,
        body.cover_image_url || null,
        user.id,
      ]
    );

    return created(story);
  } catch (err) {
    return serverError(err);
  }
}
