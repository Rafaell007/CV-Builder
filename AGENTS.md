# CV Builder

Full plan, stack, decisions and progress: [PLAN.md](PLAN.md). Read §0–§5 first, then only the step you work on.

pnpm monorepo (Node 24): `frontend/` = Next.js 16 + Apollo Client 4 + Radix UI + CSS Modules; `backend/` = NestJS 11 + GraphQL code-first + Prisma 7 + PostgreSQL 17. TypeScript only.

## Commands

Use Node 24 and pnpm 12 (`.nvmrc`, `packageManager`); run from the repo root. Each command runs in every workspace that defines the script.

- `pnpm dev` — both apps (frontend http://localhost:3000, backend http://localhost:4000, GraphQL at http://localhost:4000/graphql)
- `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm format:check` · `pnpm build`
- One app: `pnpm --filter @cv-builder/frontend <script>` or `pnpm --filter @cv-builder/backend <script>`
- `docker compose up -d` — PostgreSQL + Mailpit
- `pnpm --filter @cv-builder/frontend codegen` — regenerate the frontend's GraphQL types after `schema.gql` or a `.graphql` file changes (`dev`, `build`, `typecheck`, `test` run it first)
- `pnpm --filter @cv-builder/backend schema:generate` — regenerate `backend/schema.gql` (needs the database and `DATABASE_URL`); CI fails when the committed file differs
- `pnpm --filter <app> test:cov` — coverage report, fails under 80 % (not in CI until Phase 3); `pnpm --filter @cv-builder/backend test:int` — integration tests (needs Docker)
- `pnpm test-all` — all tests in turn: unit tests (with stories), backend integration tests, then E2E; stops at the first failure (needs Docker)
- `pnpm test:e2e` — Playwright E2E: seeds `cv_builder_test`, builds both apps and runs them on ports 3100 / 4100 (needs Docker; see `e2e/README.md`)
- `pnpm storybook` — Storybook at http://localhost:6006; the frontend's `test` also runs every story in Chromium (`playwright install chromium` once; see `frontend/.storybook/README.md`)

Run `lint`, `typecheck` and the tests of the app you changed; run `pnpm test:e2e` when you change a user flow. Frontend tests render through `renderWithProviders` from `@/shared/testing`.

## Where things are

- `frontend/src/app/[locale]/` — routes only, every URL starts with the language (`/en/users`); `frontend/src/i18n/` — next-intl wiring; `frontend/src/features/<name>/` — one folder per feature; `frontend/src/shared/` — UI kit, styles, apollo, utils
- `backend/src/modules/<name>/` — one Nest module per domain; `backend/src/common/` — guards, filters, pagination; `backend/prisma/` — schema, migrations, seed
- `backend/schema.gql` — generated GraphQL contract; the frontend generates its types from it
- `e2e/` — Playwright workspace package: `playwright.config.ts` and specs, one folder per area
- `docs/pages/` — per-page requirements; `docs/images/` — designs

## Rules (full text: [PLAN.md §5](PLAN.md#5-development-rules))

- Frontend components are representational: props in, JSX out. Logic goes into composed hooks and pure typed utils. Styling only with CSS Modules + design tokens.
- Backend resolvers are thin; services hold business rules, ownership checks and Prisma calls. Inputs validated with class-validator. Authorization on the backend.
- One responsibility per file; one exported component per file, named like the file.
- Fractal layout: children live inside the parent; shared code moves to the nearest common ancestor; frontend imports only via a folder's `index.ts` (exception: `messages/*.json`, imported directly by `src/i18n/loadMessages`).
- Backend: a module with several topics gets one sub-folder per topic (own `dto/`, `models/`, specs), e.g. `auth/sessions/`, `cvs/cv-projects/`; integration tests live in `backend/test/<module>/`.
- A file with a test is a folder: `X/` holds `X.ts(x)`, `X.test.ts(x)` and `index.ts` (role files by role: `x.utils.ts` → `utils/`, `x.store.ts` → `store/`). Files without a test stay plain. Example: `frontend/src/shared/preferences/`.
- Each feature folder and non-obvious shared component has a short `README.md`: purpose, exports, where used, `docs/` link. Simple components get none.
- No `.js` files, no `any`. `process.env` only in `frontend/src/env.ts` (public), `frontend/src/server/env.ts` (server only) and the backend config module (exceptions: `backend/prisma.config.ts`, `backend/prisma/seed.ts`, `frontend/next.config.ts` and `e2e/playwright.config.ts`, scripts and tool configs that run outside the app).
- New env var: add to the app's `.env.example` and PLAN.md §10.
- Contract changes (`schema.gql`) are called out in the PR and agreed with the frontend side.

## Working here

- Read only the `docs/pages/` file for the screen you are building; open its image in `docs/images/` only when layout details matter.
- Do not read or edit lockfiles, `.next/`, `dist/`, `node_modules/`, `*.tsbuildinfo`, generated files.
- Next.js 16, NestJS 11, Prisma 7, Apollo Client 4 and Storybook 10 differ from older versions; check the official docs rather than relying on memory.
- Prefer targeted edits over rewriting whole files. Keep new code consistent with the neighbouring files.
