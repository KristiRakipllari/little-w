import { NextRequest } from "next/server";
import { query, queryOne } from "@calm-stories/db";
import { getAuthUser, requireStaff } from "@/app/lib/auth";
import { success, created, error, unauthorized, serverError } from "@/app/lib/response";
import type { Story, CreateStoryRequest } from "@calm-stories/shared";

// GET /api/stories — list all stories
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    const isStaff = user?.role === "admin" || user?.role === "editor";
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

    // Only staff see unpublished drafts; parents and anonymous
    // visitors get published stories only.
    if (!isStaff) {
      conditions.push("s.is_published = true");
    }

    if (level) {
      params.push(level);
      conditions.push(`s.level = $${params.length}`);
    }

    if (published !== null && isStaff) {
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
      user = await requireStaff(req);
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
