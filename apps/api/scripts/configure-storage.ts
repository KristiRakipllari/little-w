import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load .env from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

// The bucket enforces its own MIME allowlist and size cap, independently of
// the checks in /api/upload. If the two drift, uploads the API accepts get
// rejected by storage — so this script is the single source of truth and is
// safe to re-run (idempotent).
//
// Keep in sync with apps/api/src/app/api/upload/route.ts.
const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "audio/mpeg",
  "audio/mp4",
];

// Must be >= the largest per-kind limit the API allows (audio: 20MB).
const FILE_SIZE_LIMIT = 20 * 1024 * 1024;

const BUCKET = process.env.SUPABASE_BUCKET || "story-assets";

async function main(): Promise<void> {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env (the service key, not the anon key — updating a bucket requires admin rights)."
    );
  }

  const supabase = createClient(url, serviceKey);

  const { data: existing, error: getError } = await supabase.storage.getBucket(BUCKET);
  if (getError) {
    throw new Error(`Could not read bucket "${BUCKET}": ${getError.message}`);
  }

  report("before", existing);

  const { error: updateError } = await supabase.storage.updateBucket(BUCKET, {
    public: true,
    fileSizeLimit: FILE_SIZE_LIMIT,
    allowedMimeTypes: ALLOWED_MIME_TYPES,
  });
  if (updateError) {
    throw new Error(`Could not update bucket "${BUCKET}": ${updateError.message}`);
  }

  const { data: updated, error: verifyError } = await supabase.storage.getBucket(BUCKET);
  if (verifyError) {
    throw new Error(`Updated, but could not verify: ${verifyError.message}`);
  }

  report("after", updated);

  // Verify against what the server actually stored rather than trusting the
  // update call — a silently ignored field would otherwise look like success.
  const { sizeLimit, mimeTypes } = readConfig(updated);
  if (sizeLimit !== FILE_SIZE_LIMIT) {
    throw new Error(
      `Size limit did not apply: expected ${FILE_SIZE_LIMIT}, got ${sizeLimit}.`
    );
  }
  const missing = ALLOWED_MIME_TYPES.filter((t) => !mimeTypes.includes(t));
  if (missing.length > 0) {
    throw new Error(`MIME types did not apply: missing ${missing.join(", ")}.`);
  }

  console.log("\nStorage configuration is in sync with the API.");
}

// The REST API returns snake_case; the JS client has used camelCase in some
// versions. Read both so the output can't silently show "undefined".
function readConfig(bucket: unknown): {
  isPublic: boolean;
  sizeLimit: number | null;
  mimeTypes: string[];
} {
  const b = bucket as Record<string, unknown>;
  const rawSize = b.file_size_limit ?? b.fileSizeLimit ?? null;
  const rawTypes = b.allowed_mime_types ?? b.allowedMimeTypes ?? [];
  return {
    isPublic: Boolean(b.public),
    sizeLimit: rawSize === null ? null : Number(rawSize),
    mimeTypes: Array.isArray(rawTypes) ? (rawTypes as string[]) : [],
  };
}

function report(when: string, bucket: unknown): void {
  const { isPublic, sizeLimit, mimeTypes } = readConfig(bucket);
  console.log(`\nBucket "${BUCKET}" ${when}:`);
  console.log(`  public:         ${isPublic}`);
  console.log(`  size limit:     ${sizeLimit === null ? "unlimited" : `${(sizeLimit / (1024 * 1024)).toFixed(0)}MB`}`);
  console.log(`  allowed types:  ${mimeTypes.join(", ") || "(any)"}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
