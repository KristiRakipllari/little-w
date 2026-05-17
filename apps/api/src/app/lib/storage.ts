import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || "";
const bucket = process.env.SUPABASE_BUCKET || "story-assets";

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function uploadFile(
  file: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  const path = `uploads/${Date.now()}_${fileName}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType, upsert: false });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteFile(fileUrl: string): Promise<void> {
  // Extract path from full URL
  const url = new URL(fileUrl);
  const pathParts = url.pathname.split(`/storage/v1/object/public/${bucket}/`);
  if (pathParts.length < 2) return;

  const filePath = pathParts[1];
  await supabase.storage.from(bucket).remove([filePath]);
}
