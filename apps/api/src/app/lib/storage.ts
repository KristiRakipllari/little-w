import { supabase, BUCKET } from "@/lib/supabase";

/**
 * Upload a file to Supabase Storage with a structured path.
 * Path format: stories/{storyId}/{type}_{timestamp}.{ext}
 */
export async function uploadFile(
  file: Buffer,
  originalName: string,
  contentType: string,
  storyId: string,
  type: string = "page"
): Promise<string> {
  const ext = originalName.split(".").pop() || "bin";
  const path = `stories/${storyId}/${type}_${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType, upsert: false });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Delete a file from Supabase Storage by its full public URL.
 */
export async function deleteFile(fileUrl: string): Promise<void> {
  const url = new URL(fileUrl);
  const pathParts = url.pathname.split(`/storage/v1/object/public/${BUCKET}/`);
  if (pathParts.length < 2) {
    throw new Error("Invalid file URL — could not extract storage path");
  }

  const filePath = pathParts[1];
  const { error } = await supabase.storage.from(BUCKET).remove([filePath]);
  if (error) throw new Error(`Delete failed: ${error.message}`);
}
