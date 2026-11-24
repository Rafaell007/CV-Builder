---
name: run-cv-builder
description: Run, start, drive, test, or screenshot CV Builder (Next.js frontend, NestJS backend, PostgreSQL). Use when asked to see a change working in the real app, click through a modal or form, check a time zone or language, or take a screenshot of a page.
---

CV Builder is driven through Playwright. `run.sh` starts the real backend and frontend, runs a scenario file in Chromium, and saves screenshots. There is no `chromium-cli` for this project (see Gotchas). Paths are relative to the repository root. Verified on macOS (Apple silicon) with Docker running.

## Prerequisites

Node 24, pnpm 12, Docker, and the Playwright browser, installed once as the [e2e README](../../../e2e/README.md) describes. The seeded accounts are in the root README ("Seed data and test users"). `e2e/support/signIn.ts` holds them.

## Run (agent path)

```bash
.claude/skills/run-cv-builder/run.sh
```

It does five things:

1. Starts PostgreSQL and Mailpit (`docker compose up -d --wait`).
2. Copies the scenario into `e2e/zz-run-skill/`, because `e2e/playwright.config.ts` has `testDir: "."`. It removes the folder on exit.
3. Empties and seeds `cv_builder_test`, builds both apps, and starts the backend on port 4100 and the frontend on port 3100. A running `pnpm dev` (ports 3000 and 4000) is never touched.
4. Runs the scenario in Chromium. `--no-deps` skips the `cvs-list` project.
5. Writes screenshots to `e2e/test-results/run-skill/` (git ignored). Set `RUN_OUT` to change that folder.

The default scenario is [smoke.spec.ts](smoke.spec.ts). It signs in as `user1`, creates a CV, opens the Projects tab, fills the Add project modal and adds Banking Portal. With warm build caches the whole run took 13 seconds. I did not time a cold run.

To drive another path, copy `smoke.spec.ts` to a new file, change the steps, and pass that file as the argument. This command passes the default scenario by path:

```bash
.claude/skills/run-cv-builder/run.sh .claude/skills/run-cv-builder/smoke.spec.ts
```

Keep the `../support/...` imports. They resolve inside `e2e/`, not in the skill folder. Remove what the scenario creates in a `finally` block (`deleteCvsByName`, `deleteProjectsByName`), so a failed step leaves no CV or project for the next scenario in the same run.

Look at the screenshots after every run. A passing test with a wrong screenshot is a failed run.

## Ready-made scenarios

The [scenarios](scenarios) folder has one file for each browser check that an open ticket or a past change asked for. This command ran all of them: 12 tests, 23 seconds, with warm build caches.

```bash
.claude/skills/run-cv-builder/run.sh .claude/skills/run-cv-builder/scenarios/*.spec.ts
```

Pass one file to run one scenario. A scenario that only observes writes what it saw to `$RUN_OUT/observations.jsonl` (one JSON object per line) and does not judge it. Read that file and the screenshots, and compare them with the ticket.

| File | Ticket | What it does |
|---|---|---|
| `cv-details-access.spec.ts` | KAN-147, KAN-146 | An employee opens their CV from the list (row click and View) and returns with the breadcrumb. An employee opens a CV of another user and gets `CV not found`. An admin opens a CV of an employee. Records the URL that each route opens. |
| `cvs-page-visual.spec.ts` | KAN-145 | The CVs page, the row menu and the Create, Update and Delete modals at 1440 and 768 pixels wide, in the light and dark themes, with screenshots. Records which element has the focus after each menu or modal closes. |
| `admin-creates-cv.spec.ts` | KAN-144 | An admin creates a CV on the User CVs tab of an employee. Records who owns the new CV. |
| `date-reasons.spec.ts` | KAN-170 | The Add project modal after the project was narrowed (stale form), in English and Polish, and the days sent and shown in `Pacific/Auckland` and `America/Los_Angeles`. It asserts, because the results are known. |
| `auth-and-language.spec.ts` | none | Signs in through the sign-in page, opens a page in Polish, logs out and checks that the session cookie is gone. |

The last run of these scenarios gave three results that differ from the ticket texts. Check them before you rely on a ticket: a row click and View open `/preview`, not `/details` (KAN-146). A CV that an admin creates on the User CVs tab belongs to the employee (KAN-144). All focus returns to the trigger after a menu or modal closes (KAN-145).

## Test

```bash
pnpm test-all
```

It starts Docker, then runs frontend unit and story tests, backend unit tests, backend integration tests and E2E, and stops at the first failure. It passed with 3394 tests in 2 minutes 20 seconds.

## Gotchas

- **Do not look for `chromium-cli`.** The generic `run` skill mentions it, but `chromium-cli` on npm is a placeholder package ("likely hallucinated"), and Homebrew has no such formula. Use the Playwright that `e2e/` already has.
- **Typed dates outside the picker limits are ignored.** The date picker returns to its old value and shows no error, because `toDateLimits` blocks the date before the form rule runs. You cannot trigger the client date errors by typing. A date error from the backend appears only when the form is stale.
- **Make a stale form with a second admin session.** Open the Add project modal as the user. In a second context (`browser.newContext({ baseURL })`, then `signIn` as the admin), change the project dates with the `updateProject` mutation. Then press Add.
- **The backend refuses to narrow a project that CV entries use.** It answers `The new dates do not cover the project dates in 2 CVs`. Create a new project with `createProject` from `e2e/support/projects.ts` and narrow that one. Delete it after the CV, with `deleteProjectsByName`.
- **Time zones.** `test.use({ timezoneId: "Pacific/Auckland" })` changes the time zone of the page, not of the machine. The frontend unit tests build dates with `new Date(year, month, day, hour, minute)` (local time), so they pass in any zone. I ran them with `TZ` set to `Pacific/Auckland`, `America/Los_Angeles`, `Asia/Kolkata` and `UTC`.
- **Languages.** Page URLs start with the language (`/en/...`, `/pl/...`). The Polish modal names are `Dodaj projekt`, `Nazwa`, `Role`, `Obowiązki` and the button `Dodaj`. Polish dates read `01.01.2024`.
- **Wait before you read the focus.** Focus returns to the trigger after the close animation. Read straight after `Escape`, my first run showed the page body for a modal that did return its focus (a false finding). `cvs-page-visual.spec.ts` waits 600 ms first.
- **The Roles list covers the next field.** Fill Responsibilities after you pick a role. That moves the focus and closes the list, so the click on Add reaches the button.
- **The database is `cv_builder_test`.** `e2e:db` empties it at the start of every run. Never point a scenario at the development database.

## Troubleshooting

- **`The generated GraphQL file is missing or stale. Run: pnpm --filter @cv-builder/frontend codegen`** appears when you run `vitest` after `schema:generate` or a `.graphql` change. Run the codegen command from the message. `run.sh` does not need it, because the frontend build runs codegen itself.
- **`GraphQL failed: The new dates do not cover the project dates in 2 CVs`**: the scenario tried to narrow a seeded project. Use a new project, as in Gotchas.
