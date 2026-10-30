import { Client } from "pg";
import { getTestDatabaseUrl } from "./test-database-url";

/** Empties every table except Prisma's migration history, so each test file starts from a clean database. */
export async function truncateTables(): Promise<void> {
  const client = new Client({ connectionString: getTestDatabaseUrl() });
  await client.connect();
  try {
    const { rows } = await client.query<{ tablename: string }>(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'",
    );
    if (rows.length === 0) {
      return;
    }
    const tables = rows.map(({ tablename }) => `"${tablename}"`).join(", ");
    await client.query(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE`);
  } finally {
    await client.end();
  }
}
