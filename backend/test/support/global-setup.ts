import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { Client } from "pg";
import { getTestDatabaseUrl } from "./test-database-url";

/** Runs once before all integration tests: makes sure the test database exists and is migrated. */
export default async function globalSetup(): Promise<void> {
  const url = new URL(getTestDatabaseUrl());
  const databaseName = url.pathname.slice(1);

  // Connect to the default "postgres" database, because the test database may not exist yet.
  const adminUrl = new URL(url);
  adminUrl.pathname = "/postgres";
  const admin = new Client({ connectionString: adminUrl.toString() });
  await admin.connect();
  try {
    const existing = await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", [
      databaseName,
    ]);
    if (existing.rowCount === 0) {
      // Identifiers cannot be parameters; the name is safe because getTestDatabaseUrl() restricts it.
      await admin.query(`CREATE DATABASE "${databaseName}"`);
    }
  } finally {
    await admin.end();
  }

  execFileSync("pnpm", ["exec", "prisma", "migrate", "deploy"], {
    cwd: join(__dirname, "..", ".."),
    env: { ...process.env, DATABASE_URL: url.toString() },
    stdio: "inherit",
  });
}
