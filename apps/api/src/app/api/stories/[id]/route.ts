import { NextRequest } from "next/server";
import { query, queryOne } from "@calm-stories/db";
import { requireAuth } from "@/app/lib/auth";
import { success, error, notFound, unauthorized, serverError } from "@/app/lib/response";
import type { Story, StoryWithPages, StoryPage, UpdateStoryRequest } from "@calm-stories/shared";

interface Params {
  params: { id: string };
}

// GET /api/stories/:id — get story with pages
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const story = await queryOne<Story>(
      `SELECT s.*,
        (SELECT COUNT(*) FROM story_pages WHERE story_id = s.id)::int AS page_count
       FROM stories s WHERE s.id = $1`,
      [params.id]
    );

    if (!story) return notFound("Story not found");

    const pages = await query<StoryPage>(
      "SELECT * FROM story_pages WHERE story_id = $1 ORDER BY page_number ASC",
      [params.id]
    );

    return success({ ...story, pages } as StoryWithPages);
  } catch (err) {
    return serverError(err);
  }
}

// PUT /api/stories/:id — update story
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    try {
      await requireAuth(req);
    } catch {
      return unauthorized();
    }

    const body: UpdateStoryRequest = await req.json();

    const existing = await queryOne("SELECT id FROM stories WHERE id = $1", [params.id]);
    if (!existing) return notFound("Story not found");

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (body.title !== undefined) {
      fields.push(`title = $${idx++}`);
      values.push(body.title);
    }
    if (body.description !== undefined) {
      fields.push(`description = $${idx++}`);
      values.push(body.description);
    }
    if (body.level !== undefined) {
      fields.push(`level = $${idx++}`);
      values.push(body.level);
    }
    if (body.is_premium !== undefined) {
      fields.push(`is_premium = $${idx++}`);
      values.push(body.is_premium);
    }
    if (body.is_published !== undefined) {
      fields.push(`is_published = $${idx++}`);
      values.push(body.is_published);
    }
    if (body.cover_image_url !== undefined) {
      fields.push(`cover_image_url = $${idx++}`);
      values.push(body.cover_image_url);
    }

    if (fields.length === 0) {
      return error("No fields to update");
    }

    values.push(params.id);
    const story = await queryOne<Story>(
      `UPDATE stories SET ${fields.join(", ")} WHERE id = $${idx}
       RETURNING *, (SELECT COUNT(*) FROM story_pages WHERE story_id = stories.id)::int AS page_count`,
      values
    );

    return success(story);
  } catch (err) {
    return serverError(err);
  }
}

// DELETE /api/stories/:id — delete story
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    try {
      await requireAuth(req);
    } catch {
      return unauthorized();
    }

    const existing = await queryOne("SELECT id FROM stories WHERE id = $1", [params.id]);
    if (!existing) return notFound("Story not found");

    await queryOne("DELETE FROM stories WHERE id = $1", [params.id]);

    return success({ deleted: true });
  } catch (err) {
    return serverError(err);
  }
}
