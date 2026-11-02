# CV Builder — Project Plan

Single source of truth for **what we build, how, in what order, and what is done**.
Requirements per page live in [docs/](docs/README.md); coding rules in [§5](#5-development-rules); agent instructions in [AGENTS.md](AGENTS.md).

Deadline and demo: **2026-12-07** (task: 4 weeks).
Repository: [github.com/Rafaell007/CV-Builder](https://github.com/Rafaell007/CV-Builder) — `main` = releases, `development` = integration (default branch).

---

## 0. How to use this file

- **Before starting work:** find your step in [§9 Roadmap](#9-roadmap), read its docs page(s), check "Depends on".
- **Status markers:** `[ ]` todo · `[~]` in progress · `[x]` merged into `development`.
- **When a step is merged:** tick it, add the PR number, and add a line to [§12 Progress log](#12-progress-log). Do it in the same PR.
- **When a decision changes:** update [§2.3 Decision log](#23-decision-log) in the same PR as the code change.
- **Jira:** each step in §9 is one ticket (title = step title, description = its bullets). Who does which step is tracked in Jira, not here.
- **Agents:** read §0–§5 for context, then only the step you work on and its docs page.

---

## 1. Product

CV Builder: users maintain their profile, skills and languages and build CVs from projects; admins manage users and global catalogs. Two roles: **Admin** and **User**.

| Area | Pages (docs) | Access |
|---|---|---|
| Authentication | [sign-in](docs/pages/02-sign-in-page.md), [sign-up](docs/pages/03-sign-up-page.md), [forgot-password](docs/pages/04-forgot-password-page.md), [reset-password](docs/pages/05-reset-password-page.md), [verification](docs/pages/06-verification-page.md) | public |
| System | [no-internet](docs/pages/07-no-internet-page.md), [not-found](docs/pages/08-not-found-page.md), [device-error](docs/pages/09-device-error-page.md) | public |
| Users | [users](docs/pages/10-users-page.md) (main page), [user-profile](docs/pages/11-user-profile-page.md), [user-skills](docs/pages/12-user-skills-page.md), [user-languages](docs/pages/13-user-languages-page.md) | User, Admin |
| Users | [user-cvs](docs/pages/14-user-cvs-page.md) | Admin |
| Settings | [settings](docs/pages/15-settings-page.md) | User, Admin |
| Skills | [skills](docs/pages/16-skills-page.md) (own) · [skills-admin](docs/pages/17-skills-page-admin.md) (catalog) | User · Admin |
| Languages | [languages](docs/pages/18-languages-page.md) (own) · [languages-admin](docs/pages/19-languages-page-admin.md) (catalog) | User · Admin |
| CVs | [cvs](docs/pages/20-cvs-page.md), [cv-details](docs/pages/21-cv-details-page.md), [cv-skills](docs/pages/22-cv-skills-page.md), [cv-projects](docs/pages/23-cv-projects-page.md), [cv-preview](docs/pages/24-cv-preview-page.md) | User, Admin |
| Catalogs | [departments](docs/pages/25-departments-page.md), [positions](docs/pages/26-positions-page.md), [projects](docs/pages/27-projects-page.md) | Admin |

Overview and general requirements: [01-overview](docs/pages/01-overview.md). Design: Figma (link in the overview).

Cross-cutting requirements on every page: Light/Dark theme, responsive (desktop + tablet; < 768 px shows Device Error), close to the Figma design, keyboard accessible, client **and** server validation, failed requests keep entered values, loading / empty / error (+ retry) / success states.

### 1.1 Task

- Fullstack application built in a pair: **Next.js frontend + NestJS backend**, communicating through **GraphQL**, with a database, authentication and authorization, server-side validation and error handling, responsive UI, unit and integration tests, team development in Git.
- Teamwork is graded: split tasks, agree frontend/backend boundaries and the GraphQL contract, separate branches, pull requests, **code reviews**, resolved merge conflicts, meaningful contribution from each member.
- Without a partner the task is done alone with the maximum possible functionality.

### 1.2 Submission

GitHub repository with frontend and backend source code, structured commits, PR and review history, test results, and a `README.md` containing:
application description · implemented functionality · technologies and dependencies · how to run the frontend, the backend, the database and migrations · how to run unit and integration tests · coverage information · project structure · team task distribution · main architectural decisions · required environment variables · API documentation · extra: E2E tests and their test cases.

Plus a demo (max 30 minutes) with answers to the mentor's questions. A deployed link is optional.

### 1.3 Evaluation criteria

| Criterion | Covered by |
|---|---|
| Functionality per Notion docs | Phases 3–7 |
| Frontend in Next.js; routing with Next.js; SSR/SSG where required | §6, S0.4, D6 |
| Backend in NestJS; GraphQL API works; contract agreed and consistent | §3, S0.2, S2.2, D3, D4 |
| Auth and authorization (checked on the backend) | §8, Phase 3 |
| Database integration, migrations | §7, S2.1 |
| Server-side validation and error handling | S2.2, D7 |
| Application state handled correctly | Apollo cache + React Context (D5) |
| UI with the selected library, responsive | Radix UI, S0.4, Phase 1 |
| Unit tests (FE + BE), integration tests (BE), required tools, coverage > 80 % | §11, S0.5 |
| Clear modular structure, FE/BE responsibilities separated | §4, §5 |
| Env variables for config and secrets | §10 |
| README, Git history, branches, PRs, code reviews, task distribution | §5.11, S8.3 |
| Extra: E2E | S8.1 |

### 1.4 Resources

- Requirements: [docs/](docs/README.md) (export of the Notion "CV Builder Wiki")
- [Next.js](https://nextjs.org/docs) · [NestJS](https://docs.nestjs.com/) · [GraphQL](https://graphql.org/) · [Apollo Client](https://www.apollographql.com/docs/react) · [Prisma](https://www.prisma.io/docs) · [Radix UI](https://www.radix-ui.com/primitives)
- [Vitest](https://vitest.dev/) · [Testing Library](https://testing-library.com/) · [Jest](https://jestjs.io/) · [Playwright](https://playwright.dev/) · [Storybook](https://storybook.js.org/)

---

## 2. Stack and decisions

### 2.1 Task requirements → choice

| Requirement | Choice |
|---|---|
| Frontend in Next.js, SSR/SSG where required | Next.js 16, App Router |
| Backend in NestJS | NestJS 11 |
| GraphQL between frontend and backend | Code-first GraphQL (Apollo Server 5) ↔ Apollo Client 4 |
| Database + migrations | PostgreSQL 17 + Prisma 7 |
| UI library, responsive | Radix UI + CSS Modules + design tokens |
| Frontend unit tests | Vitest + React Testing Library |
| Backend unit / integration tests | Jest + `@nestjs/testing` / + Supertest |
| Extra: E2E | Playwright |
| Structured commits | Conventional Commits, enforced by commitlint |

### 2.2 Full stack

Same stack and setup order as the other intern team (D2).

| Layer | Purpose | Technology |
|---|---|---|
| Repo | Monorepo, two apps | pnpm workspaces, Node 24: `frontend/`, `backend/` |
| Frontend | Framework, routing, SSR | Next.js 16 (App Router), React 19, TypeScript strict |
| | Server data | Apollo Client 4 + `@apollo/client-integration-nextjs`; GraphQL Code Generator (typed documents from `schema.gql`) |
| | Client state | React Context (theme, language), persisted in cookies |
| | UI kit | Radix UI primitives, CSS Modules, design tokens (light/dark) |
| | Dates | date-fns, react-datepicker |
| | Forms | React Hook Form + Zod |
| | i18n (9 languages) | next-intl |
| | UI development | Storybook 10 (stories + component tests with Vitest/Playwright) |
| Backend | Framework | NestJS 11 (modules, DI, pipes, guards, filters) |
| | API | GraphQL code-first, Apollo Server 5; generated `schema.gql` = contract |
| | Database / ORM | PostgreSQL 17 (Docker) / Prisma 7 (schema, migrations, seed) |
| | Validation | `class-validator` + `class-transformer` (global `ValidationPipe`) |
| | Auth | `@nestjs/jwt`, `@node-rs/argon2`, access + refresh tokens in httpOnly cookies |
| | Mail | Nodemailer; Mailpit locally |
| | Files | Avatar upload via REST (multer), stored in PostgreSQL |
| | CV PDF | pdfmake (Roboto, Cyrillic) |
| | Config | `@nestjs/config` with validated env |
| Tests | Frontend | Vitest, RTL, user-event, Apollo `MockedProvider` |
| | Backend | Jest + `@nestjs/testing` (unit), + Supertest against a test database (integration) |
| | E2E | Playwright against a seeded database |
| Tooling | Quality | One shared ESLint + Prettier config, Husky + lint-staged, commitlint |
| | Local infra | Docker Compose: PostgreSQL 17 + Mailpit |
| | CI | GitHub Actions: format, lint, typecheck, tests, builds (not a required check: no branch protection on the free plan) |
| Deploy (optional) | Frontend / backend / DB | Vercel / Render (Docker) / Neon |

### 2.3 Decision log

| # | Date | Decision | Why |
|---|---|---|---|
| D1 | 2026-10-26 | GitFlow: `main` + `development`, `feature/<ticket>-<name>`, merge commits (no squash) | Structured commits and PR history are graded |
| D2 | 2026-10-28 | Copy the other intern team's stack and setup order: pnpm monorepo, Next.js + NestJS, Radix UI, Prisma, Storybook. MUI and TanStack Store dropped | New task requires NestJS; the teams can help each other |
| D3 | 2026-10-28 | GraphQL **code-first**; the generated `backend/schema.gql` is committed and is the contract. Frontend types are generated from it | One source of truth; contract changes are visible in PR diffs |
| D4 | 2026-10-28 | Contract first: a module's GraphQL types and operations are merged (resolvers may be stubbed) before its frontend step starts | Frontend and backend work in parallel without waiting |
| D5 | 2026-10-28 | State: server data in the Apollo cache; theme and language in React Context, persisted in cookies; an inline `<head>` script applies them before the first paint (no flash). The server does not read them, so pages stay static under Cache Components | No extra state library needed; reading cookies in the root layout would make every route dynamic ([Next.js guide](https://nextjs.org/docs/app/guides/preventing-flash-before-hydration)) |
| D6 | 2026-10-28 | Rendering: protected pages are SSR per request (Server Components query the backend, forwarding the user's cookies); auth, not-found and device-error pages are static | Protected pages are per-user, so they cannot be SSG |
| D7 | 2026-10-28 | Errors: one global exception filter maps errors to GraphQL `extensions.code` (`UNAUTHENTICATED`, `FORBIDDEN`, `BAD_USER_INPUT` with field errors, `NOT_FOUND`, `CONFLICT`); the UI shows field errors inline, others as a system error | Consistent error contract |
| D8 | 2026-10-28 | The browser calls the backend through a Next.js rewrite (`/graphql`, `/api/*` → backend), so auth cookies stay first-party | No CORS or third-party cookie issues, also when deployed on two hosts |
| D9 | 2026-10-28 | Session: access JWT 15 min + refresh token 7 days (stored hashed, rotated), both httpOnly cookies. Frontend `proxy.ts` refreshes before render; Apollo error link refreshes once, then redirects to sign-in | Users stay signed in; tokens are not readable by JS |
| D10 | 2026-10-28 | Authorization on the backend: global `JwtAuthGuard` (opt-out with `@Public()`), `RolesGuard` with `@Roles()`, ownership checks in services, `@Verified()` for verified-only actions | Docs require backend enforcement, not UI hiding |
| D11 | 2026-10-28 | Avatars: `POST /api/users/:id/avatar` (multipart, ≤ 5 MB, PNG/JPG/JPEG/GIF checked by file content), stored in PostgreSQL, served by `GET /api/users/:id/avatar` | Works locally and deployed without an extra storage service |
| D12 | 2026-10-28 | CV PDF generated on the backend (`exportCvPdf`, pdfmake with Roboto) from the same data as the preview | Docs: PDF from persisted data, permission-checked |
| D13 | 2026-10-28 | Delete rules: deleting a user cascades to everything they own; removing a user skill also removes it from their CVs; catalog items in use cannot be deleted | Defined behaviour, no dangling references |
| D14 | 2026-10-28 | E2E specs are written with each step; Phase 8 only fills gaps and stabilises | No E2E crunch in the last week |
| D15 | 2026-10-28 | Every PR gets a review and approval from the other developer before merge | Code reviews are graded |
| D16 | 2026-10-28 | Verified-only actions (verification AC-16): creating and changing CVs, changing own skills and languages. Admin-created and seed users start verified | Docs leave the list to the team; admin-created users have no way to receive a code first |
| D17 | 2026-10-28 | Main page after sign-in and after LATER: `/users` | Overview: "Users (Main Page)" |
| D18 | 2026-10-28 | Catalog items in use cannot be deleted (`CONFLICT`). "In use": a skill is referenced by UserSkill, CvSkill or Project.environment; a language by UserLanguage; a department/position by a User; a project by a CvProject | Docs say "block" only for departments; same rule everywhere (D13) |
| D19 | 2026-10-28 | Table page size: 10 | Not in docs |
| D20 | 2026-10-28 | Verification: resend 60 s cooldown, max 5 wrong attempts per code. Reset token: 1 h, single use | Not in docs |
| D21 | 2026-10-28 | Refresh rotation with a 30 s reuse grace window (old token valid once after rotation); reuse after the window revokes the whole token family. Frontend refresh is single-flight | Parallel requests (tabs, `proxy.ts` + Apollo) would otherwise log the user out; reuse detection catches stolen tokens |
| D22 | 2026-10-28 | `changePassword` and `resetPassword` revoke all the user's refresh tokens; `changePassword` issues a new one for the current session | Old sessions must not survive a password change |
| D23 | 2026-10-28 | Rate limiting with `@nestjs/throttler` (GraphQL-aware guard) on `signIn`, `signUp`, `forgotPassword`, `verifyEmail`, `resendVerificationCode` | Verification AC-18 and security requirements |
| D24 | 2026-10-28 | An admin cannot delete themselves, remove their own Admin role, or remove the last admin (`CONFLICT`) | The app must never lose its last admin |
| D25 | 2026-10-28 | Updating a project's dates is blocked (`CONFLICT`, with the count) when CV projects would fall outside them | CvProject dates must stay within the project's dates |
| D26 | 2026-10-28 | Theme and language are stored only in cookies (client-side), not on the backend | Settings docs allow it; no extra API or migration |
| D27 | 2026-10-29 | i18n: `en` and `pl`, both fully translated. The language selector lists only supported languages (settings AC-8); a language is added with its code and messages | 9 full translations per feature cost too much for the deadline; listing untranslated languages would show English anyway |
| D28 | 2026-10-28 | Device Error gate (< 768 px) is CSS-only (media query), no JS width check | No flash of the real page on SSR |
| D29 | 2026-10-28 | Steps are tagged **Must / Should / Could** (§9); Could steps are dropped first when time runs out | Fixed deadline |
| D30 | 2026-10-28 | Demo runs locally (Docker + seed). Deploy stays optional | Free-tier cold starts (~50 s) and upload limits are demo risks |
| D31 | 2026-10-28 | Integration branch renamed `developement` → `development` | Typo would spread into CI, README and deploy settings |

### 2.4 Open decisions

None. Add new ones here as `O<n>` with a default until decided.

---

## 3. Architecture

```
Browser ──► Next.js (frontend/)                                   NestJS (backend/)
            ├─ proxy.ts: route protection + session refresh       ├─ GraphQL /graphql (Apollo Server 5, code-first)
            ├─ Server Components (SSR) ── fetch with cookies ───► │    └─ resolvers ─► services ─► Prisma ─► PostgreSQL
            ├─ Client Components ── Apollo Client ──┐             ├─ REST /api/users/:id/avatar (upload, read)
            └─ rewrites /graphql, /api/* ───────────┴───────────► └─ guards · ValidationPipe · exception filter · mail
```

- **Contract:** `backend/schema.gql` is generated from the code-first types and committed. The frontend runs codegen against it (D3, D4).
- **Session:** see D9. The backend reads the access token from the cookie; `me` returns the current user or `null`.
- **Authorization:** see D10. The UI only hides what the user may not do.
- **Errors:** see D7. Unknown errors are logged and returned as `INTERNAL_SERVER_ERROR` without details.
- **List pattern:** every list query takes `search`, `sort { field, direction }`, `page { number, size }` and returns `{ items, total }` (shared GraphQL building blocks, S2.2).
- **Verification:** unverified users can sign in and use the app after LATER; verified-only actions (D16) fail with `FORBIDDEN` and `extensions.reason: EMAIL_NOT_VERIFIED`.

---

## 4. Project structure

```
CV-Builder/
  package.json · pnpm-workspace.yaml     root scripts run both apps
  tsconfig.base.json · eslint.config.ts · prettier.config.ts · commitlint.config.ts
  docker-compose.yml                     PostgreSQL 17 + Mailpit
  .github/workflows/ci.yml
  docs/                                  requirements (pages/ + images/)
  e2e/                                   Playwright workspace package: config + specs, one folder per area
  frontend/
    src/
      app/                               routes only, thin
        (auth)/                          sign-in, sign-up, verify-email, forgot-password, reset-password
        (app)/                           users, cvs, skills, languages, settings, admin/*
        not-found.tsx
      proxy.ts                           route protection + session refresh
      env.ts · server/env.ts             the only places reading process.env (public · server only)
      features/<feature>/                one folder per feature (shape below)
      shared/
        ui/                              UI kit on Radix: Button, TextField, PasswordField, Select, MultiSelect,
                                         DatePicker, OtpField, DataTable, Pagination, Menu, Modal, ConfirmModal,
                                         Toast, Tabs, Breadcrumbs, PageState, SearchField
        styles/                          design tokens, light/dark themes, global CSS
        apollo/ hooks/ utils/ i18n/ preferences/
        graphql/                         generated typed documents (codegen output, not edited)
  backend/
    schema.gql                           generated contract (committed)
    prisma/                              schema.prisma · migrations/ · seed.ts
    src/
      main.ts · app.module.ts
      config/                            env validation
      common/                            guards, decorators, filters, pagination, GraphQL building blocks
      prisma/                            PrismaService
      modules/<module>/                  one folder per module (shape below)
    test/                                integration tests (Supertest), test DB setup
```

Feature (frontend):
```
features/<feature>/
  index.ts                 public entry
  README.md                purpose, exports, used by, docs link (5–10 lines)
  Feature.tsx · Feature.module.css · Feature.test.tsx · Feature.stories.tsx
  useFeature/              composed hook (data + state + handlers): useFeature.ts · useFeature.test.ts · index.ts
  utils/                   feature.utils.ts · feature.utils.test.ts · index.ts
  feature.graphql          operations (codegen input)
  feature.types.ts
  messages/                i18n: en.json, pl.json
  components/<Child>/      same shape, one level down
```

Module (backend):
```
modules/<module>/
  <module>.module.ts
  <module>.resolver.ts     thin: map input, call service
  <module>.service.ts      business rules, ownership checks, Prisma
  dto/                     @InputType classes with class-validator
  models/                  @ObjectType classes
  <module>.service.spec.ts · <module>.resolver.spec.ts
  <child>/                 same shape (e.g. cvs/skills, cvs/projects, users/skills)
```

Placement rules (§5.9): code used by one unit stays in it; shared by siblings → their parent; shared by unrelated features → `frontend/src/shared/` or `backend/src/common/`. The **skills list UI** is used by `/skills`, the user Skills tab and CV Skills → lives in `features/skills/`. Same for languages. The frontend never imports backend code; they share only `schema.gql`.

---

## 5. Development rules

Rules for all code in this repository.

### 5.1 Representational components (frontend)

- Components receive data and callbacks through props and render markup. No data fetching, business logic, side effects, context access or `process.env` in a component body.
- Allowed: props, JSX, purely visual local state (e.g. open/closed), UI-only hooks.

### 5.2 Hook composition (frontend)

- Logic lives in custom hooks (`useXxx`); bigger hooks are composed from smaller ones and return a small typed API.
- Pages/containers call container hooks and wire the result to components.

### 5.3 Component composition (frontend)

- Compose small components (children, slots) instead of boolean-prop explosions. Components do not know which page they live in.
- Styling only through CSS Modules and design tokens; no hard-coded colours or sizes.

### 5.4 Single responsibility

- One component, hook, util, resolver or service does one thing. One exported component per file, named like the file.

### 5.5 Environment variables

- Frontend reads `process.env` only in `frontend/src/env.ts` (public `NEXT_PUBLIC_*`) and `frontend/src/server/env.ts` (server only, guarded by `server-only`), except `frontend/next.config.ts`: it runs outside the app and reads `BACKEND_URL` for the rewrites; backend only through `@nestjs/config` with a validation schema in `backend/src/config/`, except `backend/prisma.config.ts` and `backend/prisma/seed.ts`: they are Prisma CLI scripts that run outside Nest and read `DATABASE_URL` themselves (so `db:generate` works without a `.env`); and `e2e/playwright.config.ts`, a tool config that passes ports and the test database URL to the servers it starts. Both apps fail fast on missing values.
- Every new variable goes to the app's `.env.example` (no real values) and §10. `.env` files are git-ignored.

### 5.6 TypeScript only

- No `.js`/`.jsx`/`.mjs`/`.cjs` source or config files. `strict`, `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` stay on in both apps.

### 5.7 No `any`

- `any` is an ESLint error, including `as any`. Use `unknown` + narrowing, generics or proper types. `@ts-expect-error` only with a reason.
- External data is checked where it arrives: env in the config files, GraphQL input by `ValidationPipe`, route/search params in the route, form input by Zod.

### 5.8 Typed utils

- Utils are pure functions with explicit types, no React, no side effects; each is unit tested.

### 5.9 Fractal structure

- Every unit is a folder that owns its files, tests and children; the same shape repeats at every level.
- A file and its test are one unit: `X.ts(x)` and `X.test.ts(x)` live in folder `X/` with an `index.ts`. A file without a test stays a plain file. Role files are named by their role: `x.utils.ts` → `utils/`, `x.store.ts` → `store/`. A feature's main component stays at the feature root, since the feature folder is already its folder.
- Shared code moves to the **nearest common ancestor**; only code used by unrelated features goes to `shared/` (frontend) or `common/` (backend).
- Frontend folders expose one public `index.ts`; other code imports only from it. Backend modules are imported through their Nest module.
- Every feature folder and every non-obvious shared component has a short `README.md` (about 5–10 lines): what it does, what it exports, where it is used, link to its `docs/` page. Simple components (e.g. a button) get none. Update it in the same PR when the public API changes.

### 5.10 Backend code

- Resolvers are thin: input → service → output. Services hold business rules, ownership checks and Prisma calls.
- Inputs are `@InputType` classes validated with class-validator; outputs are `@ObjectType` classes. No Prisma types in the GraphQL schema.
- Authorization through guards and decorators (D10); ownership checks in services.
- GraphQL naming: queries are nouns (`users`, `cv`), mutations are verbs (`createCv`, `removeUserSkills`), inputs `<Mutation>Input`.
- A change to `schema.gql` is called out in the PR description; breaking changes are agreed with the frontend developer first.

### 5.11 Workflow

- Each step = branch `feature/<ticket>-<name>` from `development`, PR into `development`, **review and approval by the other developer** (D15), merge commit (no squash).
- Commit types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`; scope = app or module (`frontend`, `backend`, `cvs`, …); ticket key at the end when the ticket exists.
- A step is done when format, lint, typecheck and tests pass (CI green), its unit / component / integration tests (§11) are written, the step's acceptance criteria (docs AC IDs) are met, and this file is updated.
- New user-facing text goes to the feature's `messages/en.json`; other languages may start as copies.

---

## 6. Routes

| Route | Page (docs) | Access | Rendering |
|---|---|---|---|
| `/sign-in` · `/sign-up` | sign-in, sign-up | public (signed-in → `/users`) | static |
| `/verify-email` | verification | signed-in, unverified | static |
| `/forgot-password` · `/reset-password?token=` | forgot-password, reset-password | public | static |
| `/` | redirect → `/users` (D17) | — | — |
| `/users` | users (main page) | User, Admin | SSR |
| `/users/[userId]` → `/profile` · `/skills` · `/languages` · `/cvs` | user-profile, user-skills, user-languages, user-cvs | User, Admin (edit: owner or admin; CVs tab: admin) | SSR |
| `/skills` · `/languages` | skills, languages (own) | User | SSR |
| `/cvs` · `/cvs/[cvId]` → `/details` · `/skills` · `/projects` · `/preview` | cvs, cv-* | User (own), Admin (any) | SSR |
| `/settings` | settings | User, Admin | SSR |
| `/admin/skills` · `/admin/languages` · `/admin/departments` · `/admin/positions` · `/admin/projects` | catalogs | Admin | SSR |
| any other | not-found | public | static |

No-internet and device-error are states shown over any page, not routes. Sidebar by role: User — Employees, CVs, Skills, Languages; Admin — Employees, CVs, Skills, Languages, Departments, Positions, Projects (catalog pages). Profile menu: Profile, Settings, Logout.

---

## 7. Data model (Prisma)

Checked against `docs/pages/10` to `27` in S2.1a. Conventions:

- Ids are UUIDs (`@db.Uuid`). `createdAt` and `updatedAt` exist on every model except `Avatar` (`updatedAt` only) and the three token models (`createdAt` only). "Member since" in the UI is `User.createdAt`.
- Dates are stored as date or timestamp columns, never as formatted strings.
- Limits are `VarChar(n)`; the docs state them only where listed below, the rest default to 100 (names) and `Text` (long text).
- Unique names are normalised (trimmed) in the service; the unique constraint is the backstop.

| Model | Fields | Rules |
|---|---|---|
| User | id, email unique (≤ 255), passwordHash, role `ADMIN`/`USER`, isVerified, firstName? (≤ 100), lastName? (≤ 100), departmentId?, positionId?, createdAt, updatedAt | delete cascades (D13). Sign-up and admin create take only email + password (≥ 6 characters); names, department and position are required by the profile update, not by the database |
| Avatar | userId (PK), data (bytes), mimeType, updatedAt | ≤ 5 MB, PNG/JPG/JPEG/GIF (D11) |
| Department · Position | id, name unique (≤ 100), createdAt, updatedAt | delete blocked when used |
| SkillCategory | id, name unique (≤ 100), type (short text), createdAt, updatedAt | seeded; a skill's type comes from its category and is not stored on `Skill` (page 17); delete blocked while it has skills |
| Skill | id, name unique (≤ 100), categoryId, createdAt, updatedAt | delete blocked when used (D18) |
| UserSkill | id, userId + skillId unique, mastery `BEGINNER` `ELEMENTARY` `INTERMEDIATE` `ADVANCED` `EXPERT`, createdAt, updatedAt | removing it removes it from the user's CVs (D13) |
| Language | id, name unique (≤ 100), iso unique (≤ 5), nativeName (≤ 100), createdAt, updatedAt | delete blocked when used (D18) |
| UserLanguage | id, userId + languageId unique, proficiency `A1` `A2` `B1` `B2` `C1` `C2` `NATIVE`, createdAt, updatedAt | |
| Project | id, name (≤ 100), domain (≤ 100), startDate, endDate, description (≤ 2000), createdAt, updatedAt | `startDate` ≤ `endDate`. **`endDate` is required** (page 27; the plan had it optional). Delete blocked when used in a CV; date change blocked when CV projects would fall outside (D25) |
| ProjectSkill | projectId + skillId unique | the project's environment; skill delete blocked while used (D18) |
| ProjectRole | id, name unique (≤ 100) | seeded |
| Cv | id, name (≤ 255), education (≤ 255, required), description (required), userId, createdAt, updatedAt | delete cascades from the user |
| CvSkill | id, cvId + skillId unique, mastery, createdAt, updatedAt | skill must be one of the owner's skills |
| CvProject | id, cvId + projectId unique (a project is in a CV once), startDate, endDate? (empty = "Present"), responsibilities?, createdAt, updatedAt | dates within the project's dates |
| CvProjectRole | cvProjectId + roleId unique | roles of a CV project, at least one |
| VerificationCode | id, userId, codeHash, expiresAt, usedAt?, attempts, createdAt | 6 digits, 10 min, single use, resend cooldown 60 s from `createdAt` (D20) |
| PasswordResetToken | id, userId, tokenHash unique, expiresAt, usedAt?, createdAt | single use (D20) |
| RefreshToken | id, userId, tokenHash unique, familyId, expiresAt, replacedAt?, graceUsedAt?, createdAt | rotated on refresh with a 30 s grace window; reuse after it revokes the family (D21); deleted on sign-out; all revoked on password change/reset (D22) |

Delete rules (D13): everything a user owns (`Avatar`, `UserSkill`, `UserLanguage`, `Cv`, tokens) is removed with the user; a `Cv` takes its `CvSkill` and `CvProject` rows with it, and a `CvProject` its `CvProjectRole` rows. Catalog items in use (`SkillCategory`, `Department`, `Position`, `Skill`, `Language`, `Project`, `ProjectRole`) are `Restrict`, so the database refuses the delete and the service turns that into `CONFLICT` (D18).

Seed (all users verified, D16): 1 admin, 2+ users, departments, positions, skill categories + ~40 skills, 10+ languages, project roles, ~6 projects, sample CVs.

---

## 8. Permissions

| Action | User | Admin |
|---|---|---|
| Use the app while unverified (except D16 actions) | ✓ | ✓ |
| View users list and any profile / skills / languages | ✓ | ✓ |
| Edit profile, avatar, skills, languages | own only | any user |
| Create / update / delete users | — | ✓ |
| User Details → CVs tab | — | ✓ |
| CVs: view, create, update, delete, skills, projects, preview, PDF | own only | any |
| Catalogs (skills, languages, departments, positions, projects) | — | ✓ |
| Settings (theme, language, change password) | ✓ | ✓ |

---

## 9. Roadmap

**Every step ships with its tests** (§11). Feature steps are split into a backend step (**BE**) and a frontend step (**FE**) so the two developers can work in parallel; the BE step merges the contract first (D4). Steps with a user flow add their E2E spec once the flow works (D14).

**Priority (D29):** steps without a tag are **Must**. **(Should)** — do after all Must steps of the same phase. **(Could)** — dropped first when time runs out.

### Phase 0 — Monorepo and infrastructure

- [x] **S0.1 Monorepo structure**
  - pnpm workspaces (Node 24): move the Next.js app to `frontend/`, scaffold NestJS 11 in `backend/`; remove MUI and TanStack Store, npm lockfile.
  - Shared `tsconfig.base.json`, one ESLint + Prettier config, Husky + lint-staged + commitlint at the root; root scripts (`dev`, `lint`, `typecheck`, `test`, `build`, `format:check`).
  - README skeleton with the required sections (§1.2).
  - Done when: `pnpm install` + `pnpm dev` start both apps; lint and typecheck pass in both.

- [~] **S0.2 Backend infrastructure**
  - Docker Compose: PostgreSQL 17 + Mailpit. Prisma 7 with `PrismaService`; scripts `db:migrate`, `db:seed`, `db:reset`.
  - GraphQL code-first with Apollo Server 5, `schema.gql` generated and committed; `@nestjs/config` with env validation; a `health` query.
  - Prisma 7 spike first: driver adapter (`@prisma/adapter-pg`) + `prisma.config.ts`; the generated client must work in Nest dev, build and Jest. If the new `prisma-client` generator clashes with Nest's CommonJS build, use `prisma-client-js`.
  - **Spike result:** the new `prisma-client` generator works with Nest's CommonJS build when `moduleFormat = "cjs"` is set (output `backend/src/generated/prisma`, git-ignored, rebuilt by `db:generate`); `prisma-client-js` is not needed. The `pg` adapter connects lazily, so `PrismaService` runs `SELECT 1` on startup to fail fast without a database. `prisma.config.ts` reads `DATABASE_URL` with `process.env` instead of `env()`, so `db:generate` works without a `.env` (CI); `migrate` and `seed` still need it.
  - Done when: a fresh clone runs Docker + migrate + backend from the README and `health` answers.
  - Depends on: S0.1.

- [~] **S0.3 CI**
  - GitHub Actions on PRs to `development`: format, lint, typecheck, tests (with a Postgres service), builds of both apps.
  - Contract check: regenerate `schema.gql` and fail on `git diff`; run frontend codegen + typecheck against it.
  - Implementation: `.github/workflows/ci.yml`; `schema:generate` (backend) boots the app without listening so the contract is regenerated exactly as the running app writes it. The frontend codegen step is `--if-present` and starts working when S0.4b adds a `codegen` script; the typecheck runs after it. Not a required check (free plan).
  - Done when: the workflow is green on a PR.
  - Depends on: S0.1.

- [~] **S0.4 Frontend foundation**
  - Apollo Client 4 (SSR integration, cookie forwarding, error link), codegen from `backend/schema.gql`, Next.js rewrites (D8).
  - Route groups `(auth)` / `(app)` with placeholder pages (§6).
  - Design tokens from Figma, light/dark themes with CSS Modules; theme and language preferences in React Context + cookies (D5); Radix UI installed.
  - **(Should)** Storybook 10 with the theme switcher.
  - Done when: a page renders `health` through Apollo; theme switch persists without flash; Storybook runs (if done).
  - Depends on: S0.1, S0.2.

- [~] **S0.5 Test setup**
  - Frontend: Vitest + RTL + user-event (jsdom), test render helper (theme, intl, `MockedProvider`). Base already in place from S0.4a: `vitest.config.mts` (jsdom, React plugin, tsconfig paths), `test` script, Vitest + RTL + jsdom installed.
  - Backend: Jest unit config; integration config with Supertest and a separate test database, run serially (`--runInBand`), tables truncated per test file; injectable `Clock` provider for date-based rules.
  - Coverage threshold 80 % in both apps, enforced in CI from Phase 3 on (reported only before that).
  - **Backend done (S0.5b):** `test` (unit), `test:int` (integration, `backend/test/`), `test:cov` (report, fails under 80 %: the threshold is in the Jest config so it works on Windows and macOS; switch CI to it in Phase 3). Integration config `backend/test/jest-integration.json`; the `_test` database is created and migrated by a global setup and truncated before each test file. `Clock` lives in `backend/src/common/clock/`. CI runs `test:int` against its Postgres service.
  - Playwright config at the root with a seeded run.
  - **Frontend done (S0.5a):** `frontend/vitest.setup.ts` adds jest-dom matchers and cleans up after each test (Vitest globals stay off). `renderWithProviders` in `frontend/src/shared/testing/` wraps `PreferencesProvider` + `MockedProvider` and returns a user-event `user`; S0.6 adds the next-intl provider there. `test:cov` (v8, all of `src/` except tests, routes, generated code and `index.ts`; fails under 80 %; switch CI to it in Phase 3).
  - **E2E done (S0.5a):** `e2e/` is a workspace package (so lint and typecheck cover it) with `playwright.config.ts`; `pnpm test:e2e` runs `e2e:db` (backend: creates, migrates, empties and seeds `cv_builder_test`, no `migrate reset`), then production builds of both apps on ports 3100 / 4100, so `pnpm dev` and the development database are never used. CI runs it in a separate `e2e` job and uploads the HTML report.
  - Done when: one sample test per level runs locally and in CI.
  - Depends on: S0.2, S0.3.

- [ ] **S0.6 i18n**
  - next-intl, `en` and `pl` (D27), locale from the preference cookie, per-feature `messages/`.
  - Done when: switching language changes texts and persists.
  - Depends on: S0.4.

### Phase 1 — Shared UI kit (from Figma)

- [ ] **S1.1 Form controls** — Button, IconButton, TextField, PasswordField (toggle), Textarea, Select, MultiSelect, DatePicker, OtpField, SearchField (debounced); RHF + Zod helpers and server field-error mapping. Stories + tests.
- [ ] **S1.2 Data display** — DataTable (columns, sort indicator, row actions slot), Pagination, Menu (one open, Escape/outside close), Tabs, Breadcrumbs, Avatar, PageState (loading skeleton, empty, no results, error + retry). Stories + tests.
- [ ] **S1.3 Overlays and feedback** — Modal / FormModal (focus trap, Escape, primary disabled until valid and dirty), ConfirmModal, Toast notifications, SelectionToolbar ("REMOVE (n)"). Stories + tests.
- [ ] **S1.4 App layout** — `(app)` layout: sidebar by role (§6), active item, profile section + menu, header with breadcrumbs, Device Error gate (< 768 px, CSS media query only, D28), No Internet state. Depends on S1.2, S3.1 (`me`).

### Phase 2 — Data model and API conventions

- [~] **S2.1 Data model** — Prisma schema from §7 checked against every docs page, initial migration, seed (§7). Done when: `db:reset` builds a seeded database.
  - **S2.1a done:** schema for all 19 models and two migrations, `init` (generated) and `add_date_checks` (hand-written CHECK constraints for project dates). Foreign keys and sortable columns are indexed; text search inside names is not (it would need a `pg_trgm` index).
  - **S2.1b done:** `prisma/seed.ts` calls the steps in `prisma/seed/` (catalogs, users, projects, CVs); it uses `upsert` or a lookup by name, so running it twice adds nothing. 1 admin + 3 users (all verified, password hashed with `@node-rs/argon2`, accounts in the README), 41 skills in 7 categories, 12 languages, 6 projects, 5 CVs. `db:reset` is `prisma migrate reset && prisma db seed`; it still asks for confirmation, so scripts and E2E need to run the two Prisma commands with `--force`.
- [ ] **S2.2 API conventions** — shared GraphQL building blocks in `common/`: pagination / sort / search inputs and paginated output, `ValidationPipe` with field errors, exception filter (D7), guards and decorators skeleton (D10). Unit tests for each. Depends on S0.2.

### Phase 3 — Authentication

- [x] **S3.1 BE Auth core** — `signIn`, `signOut`, `refresh`, `me`; argon2, JWT cookies, refresh rotation with grace window and family revoke (D9, D21), throttling (D23); guards active globally. Integration tests for each guard.
- [x] **S3.2 FE Session** — `proxy.ts` (no session → `/sign-in`, refresh before render, signed-in on auth pages → `/users`, admin-only routes), error link refresh-then-redirect, `useCurrentUser`. Depends on S3.1, S0.4.
- [ ] **S3.3 BE Mail** — Nodemailer module (Mailpit locally), templates: verification code, password reset link (links use `FRONTEND_URL`).
- [ ] **S3.4 Sign In** — BE errors ("Invalid email or password"); FE page. AC per sign-in.
- [ ] **S3.5 Sign Up** — BE `signUp` (unique email, hash, send code, sign in); FE page → `/verify-email`. AC per sign-up. Depends on S3.3.
- [ ] **S3.6 Email Verification** — BE `verifyEmail`, `resendVerificationCode` (10 min, single use, D20), `@Verified()`; FE OTP page, CONFIRM, LATER → `/users`. AC per verification.
- [ ] **S3.7 Forgot Password** (Should) — BE `forgotPassword` (token + mail, same response for unknown emails); FE page. AC per forgot-password.
- [ ] **S3.8 Reset Password** (Should) — BE `resetPassword` (token check, expiry, single use, revokes sessions D22); FE page. AC per reset-password.

### Phase 4 — System pages and settings

- [ ] **S4.1 Not Found** — `not-found.tsx`, GO BACK. AC per not-found.
- [ ] **S4.2 No Internet** — state from the Apollo error link / offline event, RETRY refetches. AC per no-internet.
- [ ] **S4.3 Device Error** — gate from S1.4 finalised with illustration and message. AC per device-error.
- [ ] **S4.4 Settings** — theme and language selects (S0.4, S0.6); BE `changePassword` (current password check, revokes other sessions D22); FE form. AC per settings.

### Phase 5 — Catalogs (admin)

Each: BE module (CRUD, unique names, delete blocked when used, admin only) + FE page under `/admin/*`.

- [ ] **S5.1 Departments** — AC per departments.
- [ ] **S5.2 Positions** — AC per positions.
- [ ] **S5.3 Skills catalog** — with `skillCategories`; type from category. AC per skills-admin.
- [ ] **S5.4 Languages catalog** — ISO unique. AC per languages-admin.
- [ ] **S5.5 Projects** — with `projectRoles`; date rules; environment as skill tags; search name/domain; delete blocked when used in a CV; date change blocked when CV projects would fall outside (D25). AC per projects.

### Phase 6 — Users

- [ ] **S6.1 Users list** — BE `users` (search name/email, sort, page; admin create / update / delete with cascade; created users are verified (D16); last-admin and self rules (D24)); FE `/users` with admin modals. AC per users. Depends on S5.1, S5.2.
- [ ] **S6.2 User Details shell** — FE `/users/[userId]` layout, tabs (CVs admin only), breadcrumbs, `canEdit`. Depends on S6.1.
- [ ] **S6.3 Profile + avatar** — BE `updateProfile`; FE read-only vs editable profile, verify banner. **(Should)** avatar REST endpoints (D11) and upload with validation. AC per user-profile.
- [ ] **S6.4 Skills (own page + user tab)** — BE `users/skills` (remove also removes from CVs); FE `features/skills` grouped by category, add / update / remove with selection mode. AC per skills, user-skills. Depends on S5.3.
- [ ] **S6.5 Languages (own page + user tab)** — BE `users/languages`; FE same pattern. AC per languages, user-languages. Depends on S5.4.

### Phase 7 — CVs

- [ ] **S7.1 CVs list** — BE `cvs` (own vs all, search, sort, page, CRUD); FE `/cvs`. AC per cvs.
- [ ] **S7.2 CV Details** — FE `/cvs/[cvId]` layout, tabs, breadcrumbs; details form (dirty-check UPDATE); BE `updateCv`. AC per cv-details.
- [ ] **S7.3 CV Skills** — BE `cvs/skills` (only the owner's skills, no duplicates, mastery per CV); FE reuses `features/skills`. AC per cv-skills.
- [ ] **S7.4 CV Projects** — BE `cvs/projects` (dates within project, ≥ 1 role); FE add / update modal with read-only project fields. AC per cv-projects. Depends on S5.5.
- [ ] **S7.5 CV Preview** — BE `cvPreview` aggregate (experience years, last used, unique domains); FE preview layout. AC per cv-preview.
- [ ] **S7.6 Export PDF** (Should) — BE `exportCvPdf` (D12); FE EXPORT PDF action, file name from CV name, disabled when no data. AC per cv-preview.
- [ ] **S7.7 User CVs tab** — FE reuses the CVs list filtered by user; create assigns to that user. AC per user-cvs. Depends on S7.1, S6.2.

### Phase 8 — Quality and delivery

- [ ] **S8.1 E2E** — smoke flows (sign-in, create CV, preview) stable; test cases listed in the README. **(Could)** fill remaining gaps (D14).
- [ ] **S8.2 Coverage > 80 %** — both apps; results in the README.
- [ ] **S8.3 README** — all sections from §1.2, including team task distribution, architecture decisions and API documentation (link to `schema.gql` + main operations).
- [ ] **S8.4 Deploy** (Could) — frontend on Vercel, backend on Render (Docker), database on Neon; test avatar upload (5 MB) through the rewrite early; live URL in the README.
- [ ] **S8.5 Demo** — runs locally (D30); seeded demo data, script ≤ 30 minutes, likely mentor questions.

---

## 10. Environment variables

| Variable | App | Purpose |
|---|---|---|
| `BACKEND_URL` | frontend | Backend origin for rewrites and server-side requests |
| `DATABASE_URL` | backend | PostgreSQL |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | backend | Token signing (access JWT) and keyed hashing (refresh tokens); 32 characters or more |
| `THROTTLE_LIMIT`, `THROTTLE_TTL_SECONDS` | backend | Rate limit per client IP and operation (D23): at most `THROTTLE_LIMIT` calls in `THROTTLE_TTL_SECONDS` seconds (defaults 10 and 60) |
| `NODE_ENV` | backend | `development` (default), `test` or `production`; in production the auth cookies are `Secure` |
| `FRONTEND_URL` | backend | Absolute links in emails |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | backend | Mail |
| `PORT` | backend | HTTP port (default 4000) |
| `TEST_DATABASE_URL` | backend | Integration test database, name must end in `_test` (optional, defaults to `cv_builder_test` on localhost) |

---

## 11. Testing plan

Required: frontend unit tests (Vitest + RTL), backend unit tests (Jest + `@nestjs/testing`), backend integration tests (Jest + `@nestjs/testing` + Supertest), coverage over 80 %, main business scenarios covered. Extra: E2E (Playwright).

### 11.1 Frontend (Vitest + React Testing Library)

| What | Examples | Where |
|---|---|---|
| Utils | Zod schemas, date and sort helpers, preference logic | `x.utils.test.ts` next to the util |
| Hooks | feature hooks with `MockedProvider`: loading / data / error, handlers call the right mutation | `useX.test.ts` |
| Components | rendering from props, states (loading, empty, error + retry), interactions via user-event, form validation messages, values kept after a failed request, permission-based hiding, labels and focus | `Component.test.tsx` |

Query by role/label, not by class names.

### 11.2 Backend unit (Jest + `@nestjs/testing`)

Services with a mocked `PrismaService`: business rules, ownership checks, uniqueness, date rules, delete restrictions, token expiry and single use. Guards, pipes and the exception filter. Files `*.spec.ts` next to the code.

### 11.3 Backend integration (Jest + `@nestjs/testing` + Supertest)

GraphQL operations over HTTP against a test database: auth flow (cookies, refresh, sign-out), authorization (`UNAUTHENTICATED`, `FORBIDDEN`, own vs admin), validation errors with field details, main CRUD per module. Files in `backend/test/`.

### 11.4 E2E (Playwright, extra)

Main user flows per area against a seeded database, in `e2e/<area>/`; written with each step (D14).

### 11.5 Coverage

Over 80 % per app, excluding generated code, configs, `main.ts` and route files. Enforced in CI from Phase 3 on.

---

## 12. Progress log

| Date | Step | PR | Note |
|---|---|---|---|
| 2026-10-27 | Initial setup | — | Single Next.js app with MUI and TanStack Store (2d22ec2); replaced by S0.1 |
| 2026-10-28 | Docs | — | `docs/` replaced with the final wiki export |
| 2026-10-28 | Plan | — | Plan rewritten for the NestJS monorepo (D2) |
| 2026-10-28 | Plan review | — | Gaps closed: D16–D31, priorities, branch renamed to `development` |
| 2026-10-28 | S0.1 Monorepo structure | #7 | pnpm workspaces, `frontend/` + `backend/` (NestJS 11), shared tooling, README skeleton; MUI and TanStack Store removed |
| 2026-10-29 | S0.2a Docker Compose and Prisma 7 | #8 | PostgreSQL + Mailpit, Prisma 7 with `prisma-client` (CJS) and the `pg` adapter, `PrismaService`, db scripts; spike result in S0.2 |
| 2026-10-29 | S0.4a Design tokens, themes, preferences | — | Tokens from Figma (`docs/design-tokens.md`), light/dark themes, preference cookies with a pre-paint script, Radix UI installed; Apollo part (S0.4b) pending |
| 2026-10-29 | S0.3 CI workflow with contract check | — | GitHub Actions on PRs to `development` (format, lint, typecheck, tests, builds, `schema.gql` up-to-date check); `schema:generate` script; green on a PR still to be confirmed |
| 2026-10-30 | S2.1a Prisma schema and initial migration | — | 19 models from §7 checked against docs pages 10–27, indexes, `init` + `add_date_checks` migrations; project `endDate` is required (page 27) |
| 2026-11-02 | S3.1b BE Refresh and throttling (KAN-84) | — | `refresh` rotates the refresh token (`replacedAt`, same `familyId`); a replaced token works once more inside 30 s (`graceUsedAt`); a second use, or any use after 30 s, deletes the whole family and clears the cookies; `GqlThrottlerGuard` on `signIn` (in-memory counters, per IP and operation); error code `TOO_MANY_REQUESTS`. Contract change: `Mutation.refresh: Boolean!`. Migration: `add_refresh_token_grace_used_at`. New env: `THROTTLE_LIMIT`, `THROTTLE_TTL_SECONDS`. New package: `@nestjs/throttler` |
| 2026-11-02 | S3.2 FE Session (KAN-85) | — | `src/proxy.ts` (logic in `server/session`): no session → `/sign-in`, expired access token refreshed before render, signed-in on `/sign-in` and `/sign-up` → `/users`, admin-only routes (`/admin/*`, `/users/:id/cvs`) blocked for users; `createSessionLink` (refresh, retry once, then `/sign-in`); `useCurrentUser`; E2E `session/` + `signIn` helper (smoke now signs in). Operations `Me` and `Refresh` in `shared/graphql/session.graphql`. The `(app)` layout had no mock to replace; the hook is used from S1.4 |
| 2026-10-30 | S0.5b Backend test setup | — | Jest unit + coverage scripts, Supertest integration tests on a separate `_test` database (serial, truncated per file), injectable `Clock`; sample health tests |
