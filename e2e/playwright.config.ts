import { defineConfig, devices } from "@playwright/test";

// Tool config that runs outside the apps, so it reads process.env itself (PLAN §5.5).
const isCI = Boolean(process.env.CI);

// Own ports: a running `pnpm dev` (3000 / 4000, development database) is never used by E2E.
const FRONTEND_URL = "http://localhost:3100";
const BACKEND_URL = "http://localhost:4100";

// The database `e2e:db` seeds; same default as backend/test/support/test-database-url.ts.
const DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://cv_builder:cv_builder@localhost:5432/cv_builder_test";

// Building both apps takes a while, most of all on a cold CI runner.
const SERVER_START_TIMEOUT_MS = 5 * 60 * 1000;

export default defineConfig({
  // One folder per area (PLAN §4), e.g. smoke/, auth/, cvs/.
  testDir: ".",
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  // "50%" of the CPU cores and 0 (no limit) are Playwright's defaults.
  workers: isCI ? 1 : "50%",
  globalTimeout: isCI ? 20 * 60 * 1000 : 0,
  reporter: isCI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: FRONTEND_URL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Production builds against a freshly seeded database, so every run starts from the same data.
  webServer: [
    {
      name: "Backend",
      command:
        "pnpm --filter @cv-builder/backend e2e:db && pnpm --filter @cv-builder/backend build && pnpm --filter @cv-builder/backend start",
      // GraphQL answers a plain GET with 400, which Playwright counts as ready.
      url: `${BACKEND_URL}/graphql`,
      env: { PORT: "4100", DATABASE_URL, TEST_DATABASE_URL: DATABASE_URL },
      reuseExistingServer: false,
      timeout: SERVER_START_TIMEOUT_MS,
    },
    {
      name: "Frontend",
      command:
        "pnpm --filter @cv-builder/frontend build && pnpm --filter @cv-builder/frontend start --port 3100",
      url: FRONTEND_URL,
      env: { BACKEND_URL, NEXT_PUBLIC_APP_URL: FRONTEND_URL },
      reuseExistingServer: false,
      timeout: SERVER_START_TIMEOUT_MS,
    },
  ],
});
