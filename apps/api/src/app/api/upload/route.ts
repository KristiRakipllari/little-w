import { NextRequest } from "next/server";
import { requireAuth } from "@/app/lib/auth";
import { uploadFile } from "@/app/lib/storage";
import { success, error, unauthorized, serverError } from "@/app/lib/response";

// POST /api/upload — upload file to Supabase Storage
export async function POST(req: NextRequest) {
  try {
    try {
      await requireAuth(req);
    } catch {
      return unauthorized();
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return error("No file provided");
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "audio/mpeg",
      "audio/wav",
      "audio/mp3",
    ];

    if (!allowedTypes.includes(file.type)) {
      return error(
        `File type not allowed. Accepted: ${allowedTypes.join(", ")}`
      );
    }

    // Max 10MB
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return error("File too large. Maximum size is 10MB");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadFile(buffer, file.name, file.type);

    return success({ url, filename: file.name, size: file.size });
  } catch (err) {
    return serverError(err);
  }
}
