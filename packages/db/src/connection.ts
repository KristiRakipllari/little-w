import { Pool } from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load .env from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

// DATABASE_URL wins when set, so a hosted database is configured in exactly
// one place. The discrete DB_* vars remain the fallback for local Docker —
// previously they were the ONLY thing read, so setting DATABASE_URL alone
// silently connected somewhere else entirely.
const DATABASE_URL = process.env.DATABASE_URL;

// No credential defaults. Guessing a username and password meant a missing or
// half-written .env connected silently to the wrong place instead of saying
// so — the exact failure mode that makes a misconfigured database look like a
// broken app. Fail loudly instead, same as the JWT_SECRET and SMTP guards.
// Testing
if (!DATABASE_URL && !(process.env.DB_USER && process.env.DB_PASSWORD)) {
  throw new Error(
    "Database is not configured. Set DATABASE_URL (hosted), or DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME (local Docker), in the project root .env — copy .env.example to start."
  );
}

const host = DATABASE_URL
  ? new URL(DATABASE_URL).hostname
  : process.env.DB_HOST || "localhost";

// Managed Postgres (Supabase, Neon, RDS…) requires TLS; local Docker doesn't
// offer it. `rejectUnauthorized: false` accepts the provider's certificate
// without pinning a CA — standard practice for these providers, and the
// connection is still encrypted.
const isLocal = host === "localhost" || host === "127.0.0.1";
const ssl = isLocal ? undefined : { rejectUnauthorized: false };

const pool = new Pool({
  ...(DATABASE_URL
    ? { connectionString: DATABASE_URL }
    : {
        host,
        port: parseInt(process.env.DB_PORT || "5432"),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || "calm_stories",
      }),
  ssl,
  max: 20,
  idleTimeoutMillis: 30000,
  // A remote database over the public internet needs more than the 2s that
  // was fine for a container on localhost.
  connectionTimeoutMillis: isLocal ? 2000 : 15000,
});

// Idle clients can drop (network blips, managed Postgres timeouts) — log and
// let the pool replace the connection instead of crashing the process
pool.on("error", (err) => {
  console.error("Unexpected error on idle database client:", err);
});

export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}

export async function queryOne<T = any>(
  text: string,
  params?: any[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] || null;
}

export { pool };
export default pool;
