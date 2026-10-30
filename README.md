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
| Database | PostgreSQL 17 + Prisma 7 | installed (no models yet) |
| Auth | JWT access and refresh tokens in httpOnly cookies | planned |
| Tests | Vitest + React Testing Library, Jest + Supertest, Playwright (E2E) | backend Jest installed, rest planned |
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
| `db:seed` | Run `prisma/seed.ts` (a placeholder until the data model lands in S2.1) |
| `db:reset` | Drop the database, re-apply all migrations. **Deletes all data**; run `db:seed` afterwards |

The schema has no models yet, so `db:migrate` reports "Already in sync".

### Scripts

Run from the repository root; each runs in every workspace that defines it.

| Command | What it does |
|---|---|
| `pnpm dev` | Start frontend and backend in watch mode |
| `pnpm build` | Production build of both apps |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript, no emit (the frontend also generates Next.js route types) |
| `pnpm test` | Unit and integration tests |
| `pnpm format` · `pnpm format:check` | Format with Prettier, or only check |

## Tests and coverage

| Kind | Tools | Run | Status |
|---|---|---|---|
| Backend unit | Jest + `@nestjs/testing` | `pnpm --filter @cv-builder/backend test` | set up (smoke test) |
| Backend integration | Jest + Supertest, test database | _planned in S0.5_ | planned |
| Frontend unit and component | Vitest + React Testing Library | _planned in S0.5_ | planned |

Coverage target: over 80 %. Coverage report and numbers: _to be added once the coverage scripts exist._

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

The backend will also grow `common/` and `test/`. Details: [PLAN.md §4](PLAN.md) and [frontend/src/features/README.md](frontend/src/features/README.md).

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
| `FRONTEND_URL` | backend | Absolute links in emails | planned |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | backend | Mail | planned |
| `PORT` | backend | HTTP port (default 4000) | in use |

Examples live in each app's `.env.example`; the table is mirrored in [PLAN.md §10](PLAN.md). Both apps fail fast on a missing value.

## API documentation

The GraphQL contract is [backend/schema.gql](backend/schema.gql), generated from the code-first types (for now only the `health` query). Planned: a short guide to authentication, errors and pagination. _Not available yet._

## E2E tests

Planned: Playwright against a seeded database, one spec per user flow, written with each step. The list of test cases will be added here. _Not available yet._

## Workflow

- Branches: `main` (releases), `development` (integration), feature branches `feature/<ticket>-<name>` from `development`; pull requests go into `development` and need the other developer's approval.
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/), e.g. `feat(cvs): add CV table`, with the ticket key at the end.
- Git hooks (Husky, installed by `pnpm install`): ESLint and Prettier run on staged files; commitlint checks the message.
- CI (GitHub Actions, [.github/workflows/ci.yml](.github/workflows/ci.yml)) runs on pull requests to `development`: format, lint, typecheck, tests, builds of both apps, and a check that `backend/schema.gql` is up to date. It is not a required check (no branch protection on the free plan), so read its result before asking for a review.
