# E2E tests

Playwright tests that drive a real browser through the whole app: Next.js → NestJS → PostgreSQL (PLAN §11.4, D14). Specs live in one folder per area (`smoke/`, `session/`, `auth/`, `i18n/`, `sign-up/`, `verify-email/`, `forgot-password/`, `reset-password/`, `projects/`, later `cvs/`, …). Every page URL starts with the language (`/en/users`); a path without one is redirected, so specs may use either. `support/signIn.ts` signs a seeded account in through the API (not through the page, which `auth/` covers); most specs start with it, because protected pages redirect without a session. `support/projects.ts` creates and deletes projects through the API, so a spec can get more than one page of data (the `projects` spec removes them after each test). `support/signUp.ts` does the same for a new, unverified account (the seeded users are all verified); the `verify-email` spec uses it.

## Run

Needs Docker (`docker compose up -d`, which also starts Mailpit: the `sign-up` and `verify-email` specs read the verification mail and the `forgot-password` and `reset-password` specs read the reset link, all through `support/mailpit.ts`) and, once per machine, the browser: `pnpm --filter @cv-builder/e2e exec playwright install chromium`.

```
pnpm test:e2e
```

Each run:

1. `e2e:db` (backend) empties `cv_builder_test` and seeds it, so every run starts from the same data. Accounts: see "Seed data and test users" in the root README.
2. Builds and starts the backend on port 4100 and the frontend on port 3100. A running `pnpm dev` (3000 / 4000, development database) is never used. The backend runs with `THROTTLE_LIMIT=1000`: all specs share one IP and most sign in first, so the default of 10 calls per minute would fail them. The throttle is tested in `backend/test/throttling.int-spec.ts`.
3. Runs the specs in Chromium.

The HTML report is written to `e2e/playwright-report/` (`pnpm --filter @cv-builder/e2e exec playwright show-report`).

Docs: [Playwright webServer](https://playwright.dev/docs/test-webserver), [Next.js and Playwright](https://nextjs.org/docs/app/guides/testing/playwright).
