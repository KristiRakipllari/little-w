import { NextRequest } from "next/server";
import { query, queryOne } from "@calm-stories/db";
import { getAuthUser, requireStaff, hasActiveEntitlement } from "@/app/lib/auth";
import { success, created, error, notFound, unauthorized, forbidden, serverError } from "@/app/lib/response";
import type { StoryPage, CreatePageRequest } from "@calm-stories/shared";

interface Params {
  params: { id: string };
}

// GET /api/stories/:id/pages — list pages
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser(req);
    const isStaff = user?.role === "admin" || user?.role === "editor";

    const story = await queryOne<{
      id: string;
      is_premium: boolean;
      is_published: boolean;
    }>("SELECT id, is_premium, is_published FROM stories WHERE id = $1", [
      params.id,
    ]);
    if (!story) return notFound("Story not found");

    // Same access rules as GET /api/stories/:id — this route serves the
    // identical content, so it must not be a side door.
    if (!story.is_published && !isStaff) return notFound("Story not found");
    if (story.is_premium && !isStaff && !hasActiveEntitlement(user)) {
      return forbidden("Premium subscription required");
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

// POST /api/stories/:id/pages — add a page
export async function POST(req: NextRequest, { params }: Params) {
  try {
    try {
      await requireStaff(req);
    } catch {
      return unauthorized();
    }

    const story = await queryOne("SELECT id FROM stories WHERE id = $1", [params.id]);
    if (!story) return notFound("Story not found");

    const body: CreatePageRequest = await req.json();

    if (!body.text_sq && !body.text_en && !body.image_url) {
      return error("Page must have text or an image");
    }

    // Get next page number
    const last = await queryOne<{ max: number }>(
      "SELECT COALESCE(MAX(page_number), 0) AS max FROM story_pages WHERE story_id = $1",
      [params.id]
    );

    const pageNumber = (last?.max || 0) + 1;

    const page = await queryOne<StoryPage>(
      `INSERT INTO story_pages (story_id, page_number, text_sq, text_en, image_url, audio_path_sq, audio_path_en)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        params.id,
        pageNumber,
        body.text_sq || "",
        body.text_en || "",
        body.image_url || null,
        body.audio_path_sq || null,
        body.audio_path_en || null,
      ]
    );

    return created(page);
  } catch (err) {
    return serverError(err);
  }
}
