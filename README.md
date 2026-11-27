# CV Builder

Employees maintain their profile, skills and languages and build CVs from projects; admins manage users and the global skill and language catalogs. A Next.js frontend talks to a NestJS backend over GraphQL; data lives in PostgreSQL.

> **Status:** work in progress, Phase 0 (monorepo and infrastructure). Progress, stack, decisions and coding rules: [PLAN.md](PLAN.md). Per-page requirements: [docs/](docs/README.md). This README is a skeleton; each section is filled in as its feature lands.

## Contents

1. [Implemented functionality](#implemented-functionality)
2. [Technologies and dependencies](#technologies-and-dependencies)
3. [Getting started](#getting-started)
4. [Tests and coverage](#tests-and-coverage)
5. [Project structure](#project-structure)
6. [Team and task distribution](#team-and-task-distribution)
7. [Architectural decisions](#architectural-decisions)
8. [Environment variables](#environment-variables)
9. [API documentation](#api-documentation)
10. [E2E tests](#e2e-tests)
11. [Workflow](#workflow)

## Implemented functionality

Nothing user-facing yet. The repository is a pnpm monorepo with a placeholder home page in the frontend and an empty NestJS app in the backend.

Planned scope (27 pages, see [docs/](docs/README.md)):

| Area | Pages |
|---|---|
| Authentication | Sign in, sign up, forgot and reset password, email verification |
| Users | Users list, profile, skills, languages, CVs, settings |
| Catalogs | Skills and languages (with admin variants), departments, positions, projects |
| CVs | CVs list, details, skills, projects, preview and PDF export |
| System pages | No internet, not found, device error (< 768 px) |

A feature is added to this table as "done" when its PLAN.md step is merged.

## Technologies and dependencies

| Area | Choice | Status |
|---|---|---|
| Monorepo | pnpm workspaces, Node 24 | installed |
| Frontend | Next.js 16 (App Router), React 19, TypeScript strict | installed |
| Backend | NestJS 11, TypeScript strict | installed |
| UI | Radix UI + CSS Modules | planned |
| API | GraphQL, code-first (Apollo Server 5), Apollo Client 4 | planned |
| Database | PostgreSQL 17 + Prisma 7 | schema, migrations and seed in place |
| Auth | JWT access and refresh tokens in httpOnly cookies | planned |
| Tests | Vitest + React Testing Library, Jest + Supertest, Playwright (E2E) | set up |
| UI development | Storybook 10 (light/dark/system switcher, stories run as tests with accessibility checks) | set up |
| Quality | ESLint, Prettier, Husky, lint-staged, commitlint | installed |
| Hosting | Vercel, Render, Neon (optional) | planned |

Full list with reasons: [PLAN.md §3](PLAN.md).

## Getting started

Requirements: Node.js 24 (see [.nvmrc](.nvmrc)) and pnpm 12 (pinned in `package.json`; `corepack enable` provides it).

```bash
docker compose up -d                                # PostgreSQL 17 + Mailpit
pnpm install
cp frontend/.env.example frontend/.env.local        # then adjust the values
cp backend/.env.example backend/.env
pnpm --filter @cv-builder/backend db:generate       # Prisma client; needs backend/.env
pnpm --filter @cv-builder/backend db:migrate
pnpm dev
```

The backend needs the database running and `backend/.env` in place, or it will not start. Run `db:generate` once after cloning and again after every change to `backend/prisma/schema.prisma`; typecheck, build and tests need the generated client.

- Frontend: http://localhost:3000
- Backend: http://localhost:4000 (GraphQL endpoint: http://localhost:4000/graphql)
- Mailpit inbox (catches all outgoing mail): http://localhost:8025

### Running one app

```bash
pnpm --filter @cv-builder/frontend dev
pnpm --filter @cv-builder/backend dev
```

### Database and migrations

PostgreSQL 17 and Mailpit run in Docker (`docker-compose.yml`). The database is `cv_builder` on `localhost:5432` (user and password `cv_builder`, local use only); the data lives in a Docker volume and survives restarts.

```bash
docker compose up -d      # start
docker compose down       # stop, keep the data
docker compose down -v    # stop and delete the data
```

Prisma scripts, run from the repository root with `pnpm --filter @cv-builder/backend <script>`:

| Script | What it does |
|---|---|
| `db:generate` | Generate the Prisma client into `backend/src/generated` (git-ignored) |
| `db:migrate` | Create and apply migrations from `prisma/schema.prisma` |
| `db:seed` | Fill the database with the demo data below. Safe to run again: existing rows are kept, nothing is duplicated. Refuses `NODE_ENV=production`, and refuses a database that is not on `localhost` or `127.0.0.1` unless its name ends in `_test` (override for a remote demo database: `SEED_ALLOW_REMOTE=1`). A remote database whose name ends in `_test` is seeded without the override, so do not name a shared database that way. The host in the address, `host` and `hostaddr` must all be local |
| `db:reset` | Drop the database, re-apply all migrations, then seed it. **Deletes all data**; asks for confirmation first. The seed guard runs first (`prisma/check-seed-target.ts`), so a production or remote database is refused before anything is dropped. `SEED_ALLOW_REMOTE=1` lifts the remote check here too |

The schema has 19 models (field lists and delete rules: [PLAN.md §7](PLAN.md)). `db:migrate` applies the two migrations in `backend/prisma/migrations`: `init` is generated by Prisma, `add_date_checks` is written by hand because Prisma cannot express CHECK constraints.

### Seed data and test users

`db:seed` (code in `backend/prisma/seed/`) creates 4 users, 6 departments, 8 positions, 7 skill categories with 41 skills, 12 languages, 8 project roles, 6 projects and 5 sample CVs with skills and projects. All users are verified. Use these accounts for local development and E2E tests; they are for local databases only.

| Email | Password | Role | Name |
|---|---|---|---|
| `admin@example.com` | `Password123!` | Admin | Ada Admin |
| `user1@example.com` | `Password123!` | User | Jan Kowalski (frontend, 2 CVs) |
| `user2@example.com` | `Password123!` | User | Anna Nowak (backend) |
| `user3@example.com` | `Password123!` | User | Piotr Wiśniewski (QA) |

The accounts and their password are defined in `backend/prisma/seed/credentials.ts`. Signing in works once auth exists (S3.1).

### Scripts

Run from the repository root; each runs in every workspace that defines it.

| Command | What it does |
|---|---|
| `pnpm dev` | Start frontend and backend in watch mode |
| `pnpm build` | Production build of both apps |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript, no emit (the frontend also generates Next.js route types) |
| `pnpm test` | Unit tests and the frontend's Storybook tests (backend integration tests: `pnpm --filter @cv-builder/backend test:int`) |
| `pnpm test:e2e` | Playwright E2E tests against a freshly seeded database (see [E2E tests](#e2e-tests)) |
| `pnpm storybook` | Storybook at http://localhost:6006 (see [frontend/.storybook/README.md](frontend/.storybook/README.md)) |
| `pnpm format` · `pnpm format:check` | Format with Prettier, or only check |
| `pnpm --filter @cv-builder/frontend codegen` | Generate typed GraphQL documents from `backend/schema.gql` into `frontend/src/shared/graphql/generated/` (git-ignored; `dev`, `build`, `typecheck` and `test` run it first) |

## Tests and coverage

| Kind | Tools | Run | Status |
|---|---|---|---|
| Backend unit | Jest + `@nestjs/testing` | `pnpm --filter @cv-builder/backend test` | set up |
| Backend integration | Jest + Supertest, test database | `pnpm --filter @cv-builder/backend test:int` | set up (health query) |
| Frontend unit and component | Vitest + React Testing Library + user-event | `pnpm --filter @cv-builder/frontend test` | set up |
| Frontend stories | Storybook 10 + Vitest browser mode (Chromium) | `pnpm --filter @cv-builder/frontend test` | set up (theme sample) |
| E2E | Playwright, seeded test database | `pnpm test:e2e` | set up (smoke test) |

Coverage target: over 80 %. `test:cov` prints the report and fails below 80 % in each app: `pnpm --filter @cv-builder/backend test:cov` (threshold in the Jest config in `backend/package.json`) and `pnpm --filter @cv-builder/frontend test:cov` (threshold in `frontend/vitest.config.mts`; HTML report in `frontend/coverage/`). CI runs the backend `test:cov` and the same frontend tests split over 3 shards (`frontend-test-shards`: `test:shard` writes a Vitest blob report, no threshold). The `frontend-tests` job merges the reports (`test:merge`) and checks the 80 % threshold on the whole frontend, so a pull request that drops an app below 80 % fails the build.

Coverage on 2026-11-20 (unit tests; for the backend the integration tests are not counted):

| App | Statements | Branches | Functions | Lines |
|---|---|---|---|---|
| Backend | 99.6 % | 96.0 % | 97.4 % | 99.6 % |
| Frontend | 98.2 % | 93.2 % | 97.5 % | 99.5 % |

The backend `@Field(() => Type)` arrows in DTOs, models and resolvers only run when the GraphQL schema is built. `backend/src/app.schema.spec.ts` builds it in memory, so these functions count as covered.

Frontend component tests render through `renderWithProviders` from `@/shared/testing` (app providers, Apollo mocks, a user-event `user`); see [frontend/src/shared/testing/README.md](frontend/src/shared/testing/README.md).

The frontend's `test` runs two Vitest projects: `unit` (jsdom) and `storybook`, which renders every story in headless Chromium and runs its `play` function. Install the browser once per machine with `pnpm --filter @cv-builder/frontend exec playwright install chromium`; see [frontend/.storybook/README.md](frontend/.storybook/README.md).

Integration tests need the database running (`docker compose up -d`). They use a separate database, `cv_builder_test`, which is created and migrated automatically on the first run. Files run one at a time and every table is truncated before each test file. The database name must end in `_test`, otherwise the run aborts, so development data is never touched. Set `TEST_DATABASE_URL` to use another server.

## Project structure

```
frontend/                 Next.js app
  src/app/                routes only, thin
  src/features/<name>/    one folder per feature, same shape at every level
  src/shared/             code used by unrelated features (UI kit, styles, utils)
  src/env.ts              the only place that reads frontend environment variables
backend/                  NestJS app
  src/                    main.ts, app.module.ts; config/ (env validation), modules/, prisma/
docs/                     per-page requirements and designs
tsconfig.base.json        shared compiler options
eslint.config.ts          one ESLint config for both apps
prettier.config.ts        one Prettier config
```

The backend also has `common/` (shared providers such as `Clock`) and `test/` (integration tests). Details: [PLAN.md §4](PLAN.md) and [frontend/src/features/README.md](frontend/src/features/README.md).

## Team and task distribution

| Developer | Area | Steps |
|---|---|---|
| Maciej | _to be filled_ | _to be filled_ |
| Rafal | _to be filled_ | _to be filled_ |

The split follows the backend (BE) and frontend (FE) steps in [PLAN.md §9](PLAN.md); every PR is reviewed by the other developer.

## Architectural decisions

The full log is in [PLAN.md §2.3](PLAN.md). The ones that shape the code most:

- **Contract first (D3, D4):** GraphQL is code-first; the generated `backend/schema.gql` is committed and the frontend generates its types from it.
- **Rendering (D6):** protected pages are server-rendered per request; auth, not-found and device-error pages are static.
- **Same-origin API (D8):** the browser calls the backend through a Next.js rewrite, so auth cookies stay first-party.
- **Authorization on the backend (D10):** global guards and ownership checks in services; the UI never is the only protection.
- **PDF on the backend (D12):** a CV is exported from the same persisted data as its preview.

## Environment variables

| Variable | App | Description | Status |
|---|---|---|---|
| `NEXT_PUBLIC_APP_URL` | frontend | Public URL of the app | in use |
| `BACKEND_URL` | frontend | Backend origin for rewrites and server-side requests | in use |
| `DATABASE_URL` | backend | PostgreSQL connection string | in use |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | backend | Token signing | planned |
| `FRONTEND_URL` | backend | Absolute links in emails (default `http://localhost:3000`) | in use |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | backend | Mail (defaults reach Mailpit) | in use |
| `PORT` | backend | HTTP port (default 4000) | in use |
| `THROTTLE_LIMIT`, `THROTTLE_TTL_SECONDS` | backend | Rate limit per client IP and operation (defaults: 10 calls in 60 s) | in use |
| `TRUST_PROXY_HOPS` | backend | Number of proxies in front of the backend (default 0); set it in production so the rate limit sees the client IP | in use |
| `TEST_DATABASE_URL` | backend | Integration test database, name must end in `_test` (optional, has a default) | in use |

Examples live in each app's `.env.example`; the table is mirrored in [PLAN.md §10](PLAN.md). Both apps fail fast on a missing value.

## API documentation

The GraphQL contract is [backend/schema.gql](backend/schema.gql), generated from the code-first types (for now only the `health` query). Planned: a short guide to authentication, errors and pagination. _Not available yet._

## E2E tests

Playwright drives a real browser through the whole app against a freshly seeded database. Run `pnpm test:e2e` with Docker running; install the browser once per machine with `pnpm --filter @cv-builder/e2e exec playwright install chromium`. Details: [e2e/README.md](e2e/README.md).

| Area | Test case | Spec |
|---|---|---|
| Smoke | `/` redirects to the employees page, and the seeded admin shows in the list (browser → Next.js → NestJS → PostgreSQL) | `e2e/smoke/home.spec.ts` |

One spec per user flow is added with each step.

## Workflow

- Branches: `main` (releases), `development` (integration), feature branches `feature/<ticket>-<name>` from `development`; pull requests go into `development` and need the other developer's approval.
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/), e.g. `feat(cvs): add CV table`, with the ticket key at the end.
- Git hooks (Husky, installed by `pnpm install`): ESLint and Prettier run on staged files; commitlint checks the message.
- CI (GitHub Actions, [.github/workflows/ci.yml](.github/workflows/ci.yml)) runs on pull requests to `development`: format, lint, typecheck, tests, builds of both apps, and a check that `backend/schema.gql` is up to date; a separate `e2e` job runs the Playwright tests and uploads their HTML report. It is not a required check (no branch protection on the free plan), so read its result before asking for a review.
