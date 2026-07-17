import { NextRequest } from "next/server";
import { queryOne, pool } from "@calm-stories/db";
import { requireStaff } from "@/app/lib/auth";
import { deleteFile } from "@/app/lib/storage";
import { success, error, notFound, unauthorized, serverError } from "@/app/lib/response";
import type { StoryPage, UpdatePageRequest } from "@calm-stories/shared";

interface Params {
  params: { id: string; pageId: string };
}

// PUT /api/stories/:id/pages/:pageId — update page
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    try {
      await requireStaff(req);
    } catch {
      return unauthorized();
    }

    const existing = await queryOne(
      "SELECT id FROM story_pages WHERE id = $1 AND story_id = $2",
      [params.pageId, params.id]
    );
    if (!existing) return notFound("Page not found");

    const body: UpdatePageRequest = await req.json();

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (body.text_sq !== undefined) {
      fields.push(`text_sq = $${idx++}`);
      values.push(body.text_sq);
    }
    if (body.text_en !== undefined) {
      fields.push(`text_en = $${idx++}`);
      values.push(body.text_en);
    }
    if (body.image_url !== undefined) {
      fields.push(`image_url = $${idx++}`);
      values.push(body.image_url);
    }
    if (body.audio_path_sq !== undefined) {
      fields.push(`audio_path_sq = $${idx++}`);
      values.push(body.audio_path_sq);
    }
    if (body.audio_path_en !== undefined) {
      fields.push(`audio_path_en = $${idx++}`);
      values.push(body.audio_path_en);
    }

    if (fields.length === 0) {
      return error("No fields to update");
    }

    values.push(params.pageId);
    const page = await queryOne<StoryPage>(
      `UPDATE story_pages SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );

    return success(page);
  } catch (err) {
    return serverError(err);
  }
}

// DELETE /api/stories/:id/pages/:pageId — delete page
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    try {
      await requireStaff(req);
    } catch {
      return unauthorized();
    }

    const existing = await queryOne<StoryPage>(
      "SELECT * FROM story_pages WHERE id = $1 AND story_id = $2",
      [params.pageId, params.id]
    );
    if (!existing) return notFound("Page not found");

    // Delete + renumber atomically. The negate-then-renumber trick (same as
    // the reorder endpoint) avoids transient UNIQUE(story_id, page_number)
    // violations — a single renumbering UPDATE can hit the constraint
    // depending on row-processing order.
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM story_pages WHERE id = $1", [
        params.pageId,
      ]);
      await client.query(
        "UPDATE story_pages SET page_number = -page_number WHERE story_id = $1",
        [params.id]
      );
      // Values are all negative now; original ascending order = descending
      // negatives, so ROW_NUMBER over DESC restores 1..n gap-free.
      await client.query(
        `UPDATE story_pages
         SET page_number = sub.new_number
         FROM (
           SELECT id, ROW_NUMBER() OVER (ORDER BY page_number DESC) AS new_number
           FROM story_pages WHERE story_id = $1
         ) sub
         WHERE story_pages.id = sub.id`,
        [params.id]
      );
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }

    // Best-effort storage cleanup — the DB row is gone either way, and a
    // failed file delete must not fail the request.
    const orphans = [existing.image_url].filter((u): u is string => !!u);
    await Promise.allSettled(orphans.map((u) => deleteFile(u)));

    return success({ deleted: true });
  } catch (err) {
    return serverError(err);
  }
}
