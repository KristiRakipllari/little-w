import { NextRequest } from "next/server";
import { requireAdmin } from "@/app/lib/auth";
import { uploadFile, deleteFile } from "@/app/lib/storage";
import { success, error, unauthorized, forbidden, serverError } from "@/app/lib/response";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const EXT_TO_MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

// POST /api/upload — upload image to Supabase Storage (admin only)
export async function POST(req: NextRequest) {
  try {
    try {
      await requireAdmin(req);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("Forbidden")) return forbidden();
      return unauthorized();
    }

    const formData = await req.formData();

    // Debug: log all FormData keys
    const keys: string[] = [];
    formData.forEach((val, key) => {
      keys.push(`${key}=${typeof val === "string" ? val : `[Blob size=${(val as Blob).size}]`}`);
    });
    console.log("[upload] FormData entries:", keys.join(", "));

    const fileEntry = formData.get("file");
    const storyId = formData.get("storyId") as string | null;
    const type = (formData.get("type") as string) || "page";

    if (!fileEntry || typeof fileEntry === "string") {
      console.log("[upload] fileEntry type:", typeof fileEntry, "value:", fileEntry);
      return error("No file provided");
    }

    if (!storyId) {
      return error("storyId is required");
    }

    // fileEntry is a Blob — may or may not have .name/.type depending on client
    const file = fileEntry as Blob & { name?: string };
    const fileName = file.name || (formData.get("filename") as string) || `upload_${Date.now()}`;
    const fileType = file.type || "";
    const fileSize = file.size || 0;

    console.log("[upload] fileName:", fileName, "fileType:", fileType, "fileSize:", fileSize);

    // Resolve content type from declared type or file extension
    const contentType = (() => {
      const lower = fileType.toLowerCase();
      if (ALLOWED_TYPES.includes(lower)) return lower;
      const ext = fileName.split(".").pop()?.toLowerCase();
      if (ext && EXT_TO_MIME[ext]) return EXT_TO_MIME[ext];
      return lower;
    })();

    if (!ALLOWED_TYPES.includes(contentType)) {
      return error(
        `File type not allowed. Accepted: ${ALLOWED_TYPES.join(", ")}`
      );
    }

    if (fileSize > MAX_SIZE) {
      return error("File too large. Maximum size is 5MB");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadFile(buffer, fileName, contentType, storyId, type);

    return success({ url, filename: fileName, size: fileSize });
  } catch (err) {
    return serverError(err);
  }
}

// DELETE /api/upload — delete file from Supabase Storage (admin only)
export async function DELETE(req: NextRequest) {
  try {
    try {
      await requireAdmin(req);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("Forbidden")) return forbidden();
      return unauthorized();
    }

    const body = await req.json();
    const { path } = body;

    if (!path) {
      return error("path (full public URL) is required");
    }

    await deleteFile(path);
    return success({ deleted: true });
  } catch (err) {
    return serverError(err);
  }
}
