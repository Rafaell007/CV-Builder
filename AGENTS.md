# CV Builder

Plan, stack, decisions, rules and progress: [PLAN.md](PLAN.md). Read a section when you need it (rules: §5), and the step you work on. App-specific rules: `frontend/AGENTS.md`, `backend/AGENTS.md`.

## Versions (fixed, do not upgrade)

Node 24, pnpm 12, Next.js 16. NestJS 11, Prisma 7, Apollo Client 4 and Storybook 10 also differ from older versions; check the official docs rather than relying on memory.

## Gotchas

- `docker compose up -d` starts PostgreSQL + Mailpit. `pnpm --filter @cv-builder/backend test:int` and `pnpm test:e2e` need Docker.
- `pnpm test-all` runs all tests in turn: unit tests (with stories), backend integration tests, then E2E; it stops at the first failure and ends with a table of tests and time per suite (needs Docker).
- After `backend/schema.gql` or a frontend `.graphql` file changes, run `pnpm --filter @cv-builder/frontend codegen`. After a backend contract change, run `pnpm --filter @cv-builder/backend schema:generate` (needs the database and `DATABASE_URL`); CI fails when the committed `schema.gql` differs.
- Contract changes (`schema.gql`) are called out in the PR and agreed with the frontend side.
- The frontend `test` also runs every story in Chromium: `playwright install chromium` once.

## Working here

- Read only the `docs/pages/` file for the screen you are building; open its image in `docs/images/` only when layout details matter.
- Do not read or edit lockfiles, `.next/`, `dist/`, `node_modules/`, `*.tsbuildinfo`, generated files.
