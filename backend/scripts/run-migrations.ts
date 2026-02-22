import { readdir, readFile } from "fs/promises";
import { join } from "path";
import { Pool } from "pg";

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : new Pool({
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432", 10),
      database: process.env.DB_NAME || "itd_clone",
      user: process.env.DB_USER || "app",
      password: process.env.DB_PASSWORD || "secret",
    });

async function runMigrations() {
  console.log("🔄 Running migrations...");

  const migrationsPath = join(import.meta.dir, "../database/migrations");

  try {
    const files = await readdir(migrationsPath);
    const sqlFiles = files.filter((f) => f.endsWith(".sql")).sort();

    for (const file of sqlFiles) {
      console.log(`📄 Executing ${file}...`);
      const filePath = join(migrationsPath, file);
      const sql = await readFile(filePath, "utf-8");

      try {
        await pool.query(sql);
        console.log(`✅ ${file} completed`);
      } catch (error: any) {
        if (
          error.code === "42701" || // duplicate column
          error.code === "42710" || // duplicate object
          error.code === "42P07" || // duplicate table
          error.code === "23505"    // unique violation
        ) {
          console.log(`⚠️ ${file} skipped (already applied)`);
        } else {
          console.error(`❌ Error in ${file}:`, error.message);
        }
      }
    }

    console.log("✅ All migrations completed");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
