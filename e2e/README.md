# E2E tests

Playwright tests that drive a real browser through the whole app: Next.js → NestJS → PostgreSQL (PLAN §11.4, D14). Specs live in one folder per area (`smoke/`, `session/`, later `cvs/`, …). `support/signIn.ts` signs a seeded account in through the API until the sign-in page exists (S3.4); most specs start with it, because protected pages redirect without a session.

## Run

Needs Docker (`docker compose up -d`) and, once per machine, the browser: `pnpm --filter @cv-builder/e2e exec playwright install chromium`.

```
pnpm test:e2e
```

Each run:

1. `e2e:db` (backend) empties `cv_builder_test` and seeds it, so every run starts from the same data. Accounts: see "Seed data and test users" in the root README.
2. Builds and starts the backend on port 4100 and the frontend on port 3100. A running `pnpm dev` (3000 / 4000, development database) is never used.
3. Runs the specs in Chromium.

The HTML report is written to `e2e/playwright-report/` (`pnpm --filter @cv-builder/e2e exec playwright show-report`).

Docs: [Playwright webServer](https://playwright.dev/docs/test-webserver), [Next.js and Playwright](https://nextjs.org/docs/app/guides/testing/playwright).
