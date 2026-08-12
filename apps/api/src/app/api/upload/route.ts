import { NextRequest } from "next/server";
import { requireAdmin } from "@/app/lib/auth";
import { uploadFile, deleteFile } from "@/app/lib/storage";
import { success, error, unauthorized, forbidden, serverError } from "@/app/lib/response";

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const AUDIO_TYPES = ["audio/mpeg", "audio/mp4"];
const ALLOWED_TYPES = [...IMAGE_TYPES, ...AUDIO_TYPES];

// Narration runs minutes long, so audio gets a larger budget than artwork.
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_AUDIO_SIZE = 20 * 1024 * 1024; // 20MB

const EXT_TO_MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  aac: "audio/mp4",
};

// POST /api/upload — upload image or audio to Supabase Storage (admin only)
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

    const fileEntry = formData.get("file");
    const storyId = formData.get("storyId") as string | null;
    const type = (formData.get("type") as string) || "page";

    if (!fileEntry || typeof fileEntry === "string") {
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

    const isAudio = AUDIO_TYPES.includes(contentType);
    const maxSize = isAudio ? MAX_AUDIO_SIZE : MAX_IMAGE_SIZE;
    if (fileSize > maxSize) {
      return error(
        `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB for ${
          isAudio ? "audio" : "images"
        }`
      );
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
