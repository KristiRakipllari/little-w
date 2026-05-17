import fs from "fs";
import path from "path";
import { pool, query, queryOne } from "./connection";

async function migrate() {
  console.log("🔄 Running migrations...\n");

  // Ensure migrations table exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT NOW()
    )
  `);

  const migrationsDir = path.resolve(__dirname, "../migrations");
  const files = fs.readdirSync(migrationsDir).sort();

  for (const file of files) {
    if (!file.endsWith(".sql")) continue;

    const existing = await queryOne(
      "SELECT id FROM migrations WHERE name = $1",
      [file]
    );

    if (existing) {
      console.log(`  ✅ ${file} (already applied)`);
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");

    try {
      await pool.query("BEGIN");
      await pool.query(sql);
      await pool.query("INSERT INTO migrations (name) VALUES ($1)", [file]);
      await pool.query("COMMIT");
      console.log(`  🆕 ${file} (applied)`);
    } catch (err) {
      await pool.query("ROLLBACK");
      console.error(`  ❌ ${file} FAILED:`, err);
      process.exit(1);
    }
  }

  console.log("\n✅ All migrations complete.");
  await pool.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
