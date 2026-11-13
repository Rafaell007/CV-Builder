# E2E tests

Playwright tests that drive a real browser through the whole app: Next.js → NestJS → PostgreSQL (PLAN §11.4, D14). Specs live in one folder per area (`smoke/`, `session/`, `auth/`, `i18n/`, `sign-up/`, `verify-email/`, `forgot-password/`, `reset-password/`, `app-shell/`, `projects/`, later `cvs/`, …). Every page URL starts with the language (`/en/users`); a path without one is redirected, so specs may use either. `support/signIn.ts` signs a seeded account in through the API (not through the page, which `auth/` covers); most specs start with it, because protected pages redirect without a session. `support/graphql.ts` sends one GraphQL request with the cookies of the context. `support/cvs.ts` creates and deletes CVs of the signed-in user through the API (the `cvs` spec removes its CVs after each test). `support/cvSkills.ts` adds skills to a CV through the API (`addCvSkillsByName`), so the CV skills spec does not click through the Add skill modal for its set-up. `support/projects.ts` creates and deletes projects through the API, so a spec can get more than one page of data (the `projects` spec removes them after each test; `deleteProjectsByName` also removes projects that a test made through the page). Specs that add or change data share one file with the specs that count the seed data, because the tests of one file run one after another; two files would run in parallel on one database. The exception is `cvs/cvs.spec.ts`: it counts the CVs of `user1` and the admin, while `cv-details.spec.ts` and `cv-skills.spec.ts` create CVs for the same users. So `playwright.config.ts` runs it in its own project, `cvs-list`, first and alone; the `chromium` project with all other specs depends on it. The counts also skip rows with `E2E` in the name (`seedRows`). A file that changes no data may be a file of its own: `projects/projects.a11y.spec.ts` (keyboard, focus return, themes, tablet width) only opens and cancels modals. It sets the theme with the `theme` cookie, like a saved choice of the user. `support/signUp.ts` does the same for a new, unverified account (the seeded users are all verified); the `verify-email` spec uses it.

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

## Known problems (found 2026-11-13, KAN-114)

- **`projects/projects.a11y.spec.ts` fails in a full run with one worker** (`the search field, CREATE PROJECT, the sort buttons and every row menu can be reached with Tab`, `only one row menu is open at a time`). It passes when run alone, and it fails the same on a clean `development` branch, so it does not come from the CV work. Probably a data left by an earlier spec; not investigated.
