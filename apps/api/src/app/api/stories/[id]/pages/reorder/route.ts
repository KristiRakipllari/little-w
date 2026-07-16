import { NextRequest } from "next/server";
import { query, queryOne, pool } from "@calm-stories/db";
import { requireStaff } from "@/app/lib/auth";
import { success, error, notFound, unauthorized, serverError } from "@/app/lib/response";
import type { StoryPage, ReorderPagesRequest } from "@calm-stories/shared";

interface Params {
  params: { id: string };
}

// PUT /api/stories/:id/pages/reorder — reorder pages
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    try {
      await requireStaff(req);
    } catch {
      return unauthorized();
    }

    const story = await queryOne("SELECT id FROM stories WHERE id = $1", [params.id]);
    if (!story) return notFound("Story not found");

    const body: ReorderPagesRequest = await req.json();

    if (!body.page_ids || !Array.isArray(body.page_ids)) {
      return error("page_ids array is required");
    }

    // page_ids must be exactly the story's page set — a partial or mismatched
    // list would leave unlisted pages with broken page numbers
    const existingPages = await query<{ id: string }>(
      "SELECT id FROM story_pages WHERE story_id = $1",
      [params.id]
    );
    const existingIds = new Set(existingPages.map((p) => p.id));
    const sentIds = new Set(body.page_ids);

    if (
      sentIds.size !== body.page_ids.length ||
      sentIds.size !== existingIds.size ||
      body.page_ids.some((id) => !existingIds.has(id))
    ) {
      return error("page_ids must contain each page of the story exactly once");
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Temporarily set all page numbers to negative to avoid unique constraint conflicts
      await client.query(
        "UPDATE story_pages SET page_number = -page_number WHERE story_id = $1",
        [params.id]
      );

      // Set new order
      for (let i = 0; i < body.page_ids.length; i++) {
        await client.query(
          "UPDATE story_pages SET page_number = $1 WHERE id = $2 AND story_id = $3",
          [i + 1, body.page_ids[i], params.id]
        );
      }

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }

    const pages = await query<StoryPage>(
      "SELECT * FROM story_pages WHERE story_id = $1 ORDER BY page_number ASC",
      [params.id]
    );

    return success(pages);
  } catch (err) {
    return serverError(err);
  }
}
