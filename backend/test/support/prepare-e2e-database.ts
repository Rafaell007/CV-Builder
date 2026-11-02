import { execSync } from "node:child_process";
import { join } from "node:path";
import globalSetup from "./global-setup";
import { getTestDatabaseUrl } from "./test-database-url";
import { truncateTables } from "./truncate-tables";

/**
 * Prepares the database E2E tests run against (`e2e:db`): the integration test database, created and
 * migrated if needed, emptied, then filled with the seed. Avoids `prisma migrate reset`, which asks for
 * confirmation. Never touches the development database: the name must end in `_test`.
 */
async function prepareE2eDatabase(): Promise<void> {
  await globalSetup();
  await truncateTables();

  // A command string runs through the shell, which is what lets Windows start pnpm.cmd.
  execSync("pnpm exec prisma db seed", {
    cwd: join(__dirname, "..", ".."),
    env: { ...process.env, DATABASE_URL: getTestDatabaseUrl() },
    stdio: "inherit",
  });
}

prepareE2eDatabase().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
