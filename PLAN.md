# CV Builder — Project Plan

Single source of truth for **what we build, how, in what order, and what is done**.
Requirements per page live in [docs/](docs/README.md); coding rules in [§5](#5-development-rules); agent instructions in [AGENTS.md](AGENTS.md).

Team: Rafał Kazberuk, Maciej Ukalski. Deadline and demo: **2026-12-07**.

---

## 0. How to use this file

- **Before starting work:** find your step in [§9 Roadmap](#9-roadmap), read its docs page(s), check "Depends on".
- **Status markers:** `[ ]` todo · `[~]` in progress · `[x]` merged into `developement`.
- **When a step is merged:** tick it, add the PR number, and add a line to [§12 Progress log](#12-progress-log). Do it in the same PR.
- **When a decision changes:** update [§2.3 Decision log](#23-decision-log) in the same PR as the code change.
- **Jira:** each step in §9 is one ticket (title = step title, description = its bullets). The `Jira` field holds the key; `NEW` means the ticket does not exist yet.
- **Agents:** read §0–§5 for context, then only the step you work on and its docs page.

---

## 1. Product

CV Builder: employees maintain their profile, skills and languages and build CVs from projects; admins manage users and global catalogs. Two roles: **Admin** and **Employee**.

| Area | Pages (docs) |
|---|---|
| Authorisation | [sign-in](docs/01-authorisation/sign-in/README.md), [sign-up](docs/01-authorisation/sign-up/README.md), [verification](docs/01-authorisation/verification/README.md), [forgot-password](docs/01-authorisation/forgot-password/README.md), [reset-password](docs/01-authorisation/reset-password/README.md) |
| System and settings | [not-found](docs/02-errors-and-settings/not-found/README.md), [no-internet](docs/02-errors-and-settings/no-internet/README.md), [device-error](docs/02-errors-and-settings/device-error/README.md), [settings](docs/02-errors-and-settings/settings/README.md) |
| Users | [users](docs/03-users/users/README.md), [user-profile](docs/03-users/user-profile/README.md), [user-skills](docs/03-users/user-skills/README.md), [user-languages](docs/03-users/user-languages/README.md), [user-cvs](docs/03-users/user-cvs/README.md) |
| Skills | [skills](docs/04-skills/skills/README.md) (own), [skills-admin](docs/04-skills/skills-admin/README.md) (catalog) |
| Languages | [languages](docs/05-languages/languages/README.md) (own), [languages-admin](docs/05-languages/languages-admin/README.md) (catalog) |
| CVs | [cvs](docs/06-cvs/cvs/README.md), [cv-details](docs/06-cvs/cv-details/README.md), [cv-skills](docs/06-cvs/cv-skills/README.md), [cv-projects](docs/06-cvs/cv-projects/README.md), [cv-preview](docs/06-cvs/cv-preview/README.md) |
| Admin catalogs | [departments](docs/07-others/departments/README.md), [positions](docs/07-others/positions/README.md), [projects](docs/07-others/projects/README.md) |

Cross-cutting requirements on every page: Light/Dark theme, responsive (desktop + tablet; < 768 px shows Device Error), keyboard accessible, inline validation, failed requests keep entered values, loading / empty / error (+ retry) states.

### 1.1 Task

- **Mentor ticket:** JST-3581 (parent JST-3573), reporter Oleksandr Onyshko, label React. Team work is tracked in Jira project **KAN** (frontendpractise.atlassian.net).
- **Due date:** 2026-12-07.
- Implement all functionality from the Notion wiki "CV Builder Wiki Frontend" (summarised per page in `docs/`), in tandem with another intern. Without a partner the task is done alone, same deadline.
- Libraries are to be agreed with the mentor before completing the task (O1).

### 1.2 Completion format

A GitHub repository containing:
- source code;
- `README.md` with brief functionality, list of dependencies, startup instructions, deployment notes and live URL, instructions for running unit tests;
- structured commits;
- extra: when E2E tests are added, their structure by test case listed in the README.

Plus a demo of the application with answers to the mentor's questions (max 30 minutes).

### 1.3 Evaluation criteria

| Criterion | Covered by |
|---|---|
| The application works without errors | All steps, S5.3 |
| Next.js routing is configured correctly | §6 routes, S0.9, S0.10 |
| State is processed through the selected state management | Apollo Client cache + TanStack Store (S0.3, S0.4) |
| The UI is adaptive and implemented with the UI library | MUI, responsive + Device Error (S0.9, S2.3) |
| API requests are executed dynamically | Apollo Client over HTTP in the browser (D6) |
| Repository formatted: project structure, README with launch instructions | §4, S0.0, S5.3 |
| Unit test coverage over 80 % | §11, S0.6, S5.3 |
| Extra: E2E tests are working | S5.1, S5.2 |

### 1.4 Resources

- Requirements: [CV Builder Wiki Frontend (Notion)](https://innowise-frontend.notion.site/32e1d8d45e0d8010a41ed21fb0e8f3fc)
- [Next.js](https://nextjs.org/docs) · [Material UI](https://mui.com/material-ui/) · [TanStack Store](https://tanstack.com/store) · [GraphQL](https://graphql.org/)
- [Apollo Client integration for Next.js](https://github.com/apollographql/apollo-client-integrations/tree/main/packages/nextjs) · [Apollo Server](https://www.apollographql.com/docs/apollo-server) · [Prisma](https://www.prisma.io/docs)
- [Testing Library](https://testing-library.com/) · [Vitest](https://vitest.dev/) · [Playwright](https://playwright.dev/)
- [Vercel](https://vercel.com/docs) · [Neon](https://neon.tech/docs)

---

## 2. Stack and decisions

### 2.1 Task requirements → choice

| Requirement (task description) | Choice |
|---|---|
| Next.js, pages with SSR/SSG | Next.js 16, App Router |
| Data via a locally configured backend with GraphQL + Apollo | Own GraphQL backend in the same app: **Apollo Server** + **Apollo Client** |
| UI library, adaptive UI | Material UI |
| State through state management | Apollo Client cache (server data) + TanStack Store (client state) |
| Unit tests and component tests (RTL + Vitest), > 80 % coverage | Vitest (unit) + React Testing Library (components) + `@vitest/coverage-v8` |
| Extra: E2E | Playwright |
| Structured commits | Conventional Commits, enforced by commitlint |

### 2.2 Full stack

| Layer | Purpose | Technology |
|---|---|---|
| Frontend | Framework, routing, SSR/SSG | Next.js 16 (App Router), React 19, TypeScript strict |
| | UI, theming | Material UI 9 + Emotion, `@mui/material-nextjs`, `@mui/x-date-pickers` + date-fns |
| | Server data | Apollo Client + `@apollo/client-integration-nextjs` |
| | Client state | TanStack Store (`@tanstack/react-store`) |
| | Forms | React Hook Form + Zod (`@hookform/resolvers`) |
| | i18n (9 languages) | next-intl |
| | CV PDF export | `@react-pdf/renderer` (client side) |
| Backend | GraphQL server | Apollo Server + `@as-integrations/next` (Route Handler `/api/graphql`) |
| | Schema | SDL `.graphql` files per module |
| | Types | GraphQL Code Generator (resolver types + typed documents) |
| | Database / ORM | PostgreSQL / Prisma (schema, migrations, seed) |
| | Validation | Zod (schemas shared with frontend) |
| | Auth | argon2 (passwords), `jose` (JWT) in httpOnly cookies |
| | Mail | Nodemailer; Mailpit locally, Resend (SMTP) in production |
| | File upload | Vercel Blob (avatars) |
| Tests | Unit / component / hook / service | Vitest, RTL, user-event, Apollo `MockedProvider` |
| | E2E | Playwright against a seeded database |
| Tooling | Quality | ESLint, Prettier, Husky + lint-staged, commitlint (done in KAN-12) |
| | Local infra | Docker Compose: PostgreSQL + Mailpit |
| Deploy | App (front + API) | Vercel |
| | Production DB | Neon (PostgreSQL via Vercel Marketplace) |

### 2.3 Decision log

| # | Date | Decision | Why |
|---|---|---|---|
| D1 | 2026-10-26 | Fractal structure, representational components, hooks for logic, TS only, no `any` | Rules in §5 (merged from the former `developement-rules.md` on 2026-10-27) |
| D2 | 2026-10-26 | GitFlow: `main` + `developement`, `feature/KAN-<n>-name`, merge commits (no squash) | Structured commits are graded |
| D3 | 2026-10-27 | **Fullstack: we write the backend ourselves** | Provided CV Builder API link in Notion is dead |
| D4 | 2026-10-27 | Backend inside the Next.js app (`/api/graphql`), not a separate service | One repo, one deploy, no CORS, shared types |
| D5 | 2026-10-27 | Deploy everything on Vercel + Neon; Render dropped | Simpler, no cold starts; replaces "backend on Render" |
| D6 | 2026-10-27 | Server-side Apollo uses `SchemaLink`, browser uses HTTP | SSG works during `next build`; requests stay dynamic in the browser |
| D7 | 2026-10-27 | Own JWT auth with `jose` (Better Auth = fallback) | Keeps auth in GraphQL, demonstrable code |
| D8 | 2026-10-27 | Vertical steps: one step = API + UI + tests of a feature | No waiting on each other, one PR per feature |
| D9 | 2026-10-27 | Server secrets in `src/server/env.ts` (`server-only`); `src/env.ts` keeps public vars | Secrets never reach the browser (amends rule 5) |

### 2.4 Open decisions

| # | Question | Default until decided |
|---|---|---|
| O1 | Mentor approval of the library list and of writing our own backend (task requires discussing libraries) | Proceed with this plan |
| O2 | Maciej's agreement to D3–D9 and the ownership split | — |
| O3 | Main page after sign-in / LATER on verification | `/cvs` |
| O4 | Sidebar: employee "Skills"/"Languages" = own pages; admin catalogs in an Admin group | See §6 routes |
| O5 | Block deleting a Position / Skill / Language / Project that is in use (docs say it only for Departments) | Block, same message pattern |
| O6 | Skill **Type** values (derived from category) | Seeded with categories |
| O7 | Project roles catalog: no admin page in docs | Seeded list |
| O8 | Page size for tables | 10 |

---

## 3. Architecture

```
Browser ── Apollo Client (HTTP) ──► Next.js on Vercel
                                     ├─ pages: Server Components (SSR/SSG)
                                     │    └─ Apollo Client + SchemaLink ─► schema executed in-process
                                     ├─ /api/graphql (Route Handler) ─► Apollo Server
                                     │                                   └─ resolvers ─► services ─► Prisma ─► PostgreSQL
                                     └─ proxy.ts ─► route protection (no session → /sign-in)
```

- **Session:** short-lived access JWT + refresh token, both `httpOnly`, `Secure`, `SameSite=Lax` cookies. `context.ts` resolves the current user per request.
- **Authorization lives in services** (backend). The UI only hides what the user may not do.
- **Errors:** GraphQL errors carry `extensions.code` (`UNAUTHENTICATED`, `FORBIDDEN`, `BAD_USER_INPUT` with field errors, `NOT_FOUND`, `CONFLICT`). The UI maps field errors inline and others to a system error.
- **List pattern:** every list query takes `search`, `sort { field, direction }`, `page { number, size }` and returns `{ items, total }`.

---

## 4. Project structure (fractal)

```
task-8/
  prisma/              schema.prisma · migrations/ · seed.ts
  e2e/                 Playwright specs, one folder per area (mirrors features/)
  docker-compose.yml   PostgreSQL + Mailpit
  codegen.ts · vitest.config.ts · playwright.config.ts
  src/
    app/                               routes only, thin
      api/graphql/route.ts             mounts Apollo Server from src/server
      (auth)/                          public: sign-in, sign-up, verify-email, forgot-password, reset-password
      (app)/                           protected: cvs, users, skills, languages, settings, admin/*
      not-found.tsx
    proxy.ts                           redirect without session
    env.ts                             public env (NEXT_PUBLIC_*)
    features/                          frontend, one folder per feature
      <feature>/
        index.ts                       public entry
        Feature.tsx · Feature.test.tsx representational component
        useFeature.ts                  composed hook (data + state + handlers)
        feature.graphql                operations used by this feature (codegen input)
        feature.utils.ts · feature.types.ts
        messages/                      i18n: en.json … uk.json
        components/<Child>/            same shape, one level down
    shared/                            only code used by unrelated features
      components/                      DataTable, RowActionsMenu, PageState, FormModal, ConfirmModal,
                                       PasswordField, SelectField, DateField, TagsField, OtpField, SelectionToolbar
      hooks/ utils/ theme/ store/ i18n/ apollo/
      validation/<module>.ts           Zod schemas used by both a feature and a server module
      graphql/                         generated types (codegen output, not edited)
    server/                            backend; every file starts with `import "server-only"`
      index.ts                         schema + context factory
      context.ts · db.ts · env.ts
      lib/                             cross-module helpers: password, jwt, cookies, guards, errors, pagination, mail, upload
      modules/<module>/                same fractal shape as features
        index.ts
        <module>.graphql               SDL
        <module>.resolvers.ts          thin: parse input, call service
        <module>.service.ts            business rules + permissions + Prisma
        <module>.test.ts
        <child>/                       same shape (e.g. cvs/skills, cvs/projects, cvs/preview, users/skills, users/languages)
```

Placement rules (§5.9 applied):
- Code used by one feature stays in it. Shared by sibling children → their parent. Shared by unrelated features → `shared/`.
- **Skills list UI** is used by `/skills`, the User Details Skills tab and CV Skills → lives in `features/skills/` and is imported via its `index.ts`. Same for languages.
- **Frontend never imports `src/server/`.** The only shared code is `shared/validation` and generated types.

---

## 5. Development rules

Rules for all code in this repository. They apply to frontend and backend alike.

### 5.1 Representational components (UI only)

- Components are **representational**: they receive data and callbacks through props and render markup. Nothing else.
- No data fetching, no business logic, no side effects, no direct access to stores, contexts or `process.env` inside a component body.
- Allowed in a component: props, JSX, purely visual local state (e.g. open/closed), and calling hooks that exist only for UI concerns.
- Anything non-visual lives in a hook or a util (5.2, 5.4).

### 5.2 Hook composition

- Logic is extracted into custom hooks (`useXxx`), and bigger hooks are **composed from smaller hooks**.
- A hook returns a small, typed, stable API (values and handlers). Components never see how it is built.
- Do not call the same data source from several unrelated components; compose one hook and pass the result down.
- Container-level hooks (data, state, handlers) are called by the page/container, whose only job is to wire hooks to components.

### 5.3 Component composition

- Build UI by **composing** small components (children, slots, props), not by growing one large component or using flags and branches for every variant.
- Prefer `children` and explicit slot props over boolean-prop explosions.
- Pages/containers assemble components; components do not know which page they live in.

### 5.4 Single responsibility

- One component, hook, util, resolver or service does one thing. If its description needs "and", split it.
- One exported component per file; file name matches the export.
- Keep files short enough to read in one screen where possible; split by responsibility, not by line count.

### 5.5 Environment variables

- Public values (`NEXT_PUBLIC_*`) are read **only** in `src/env.ts`; server secrets **only** in `src/server/env.ts` (starts with `import "server-only"`). Both validate, type and export a single object. Never use `process.env` anywhere else.
- `NEXT_PUBLIC_*` variables must be accessed as literal properties (`process.env.NEXT_PUBLIC_X`), otherwise Next.js does not inline them for the browser.
- Every new variable is added to `.env.example` (no real values) and to the Vercel project settings (Production and Preview). `.env` is git-ignored.

```ts
// src/server/env.ts
import "server-only";

const required = (key: string, value: string | undefined): string => {
  if (!value) throw new Error(`Missing env variable: ${key}`);
  return value;
};

export const serverEnv = {
  databaseUrl: required("DATABASE_URL", process.env.DATABASE_URL),
  jwtSecret: required("JWT_SECRET", process.env.JWT_SECRET),
} as const;
```

### 5.6 TypeScript only, no `.js`

- No `.js`, `.jsx`, `.mjs` or `.cjs` files in the repo. Config and scripts are TypeScript too (`next.config.ts`, `eslint.config.ts`, `prettier.config.ts`, `commitlint.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `codegen.ts`, `prisma/seed.ts`).
- `allowJs` stays `true` in `tsconfig.json`: Next.js rewrites it on every build, so it cannot be turned off. The rule is enforced by convention and code review.
- `strict` stays on, together with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`.

### 5.7 No `any`

- `any` is forbidden (`@typescript-eslint/no-explicit-any` is an error), including `as any` and implicit any.
- Use `unknown` plus narrowing, generics, or proper types instead.
- Avoid `@ts-ignore`; if unavoidable, use `@ts-expect-error` with a reason.
- Data entering from outside is checked where it arrives: environment variables in the env files, route and search params in the route that reads them, GraphQL input in the resolver (Zod), GraphQL responses and form input in the hook that receives them. Inside the app, code works with typed values only.

### 5.8 Typed utils

- Utils are pure functions with explicit parameter and return types.
- Generic utils use generics rather than loose types.
- Utils contain no React and no side effects; each is unit tested.

### 5.9 Fractal structure

Files and folders follow a **fractal** layout: every unit is a self-contained folder, and the same shape repeats at every level. The full tree is in [§4](#4-project-structure-fractal).

- A component, feature, page or server module is a folder that owns everything it needs: its main file, hooks, utils, types, tests and child units.
- A folder's internal layout mirrors the layout of the project: a child big enough to need its own hooks or utils becomes a folder with the same shape.
- Children live **inside** their parent. Code used by only one parent stays in that parent's folder.
- When two siblings need the same code, move it up to their **nearest common ancestor**, not straight to a global shared folder. Only code used across unrelated features goes to `src/shared/` (frontend) or `src/server/lib/` (backend).
- Each folder exposes a single public entry (`index.ts`). Other code imports from the folder, never from files deep inside it.
- Dependencies point downward or sideways through public entries, never into another unit's internals.

### 5.10 Server code

- Every file in `src/server/` starts with `import "server-only"`. The frontend never imports `src/server/`; it talks to it only through GraphQL.
- Resolvers are thin: validate input, call a service, return. Services hold business rules, permission checks and Prisma calls.
- Authorization is enforced in services (§8); the UI only hides what the user may not do.
- GraphQL naming: queries are nouns (`users`, `cv`), mutations are verbs (`createCv`, `removeUserSkills`), inputs `<Mutation>Input`.

### 5.11 Workflow

- Each step = branch `feature/KAN-<n>-<name>` from `developement`, PR into `developement`, merge commit (no squash).
- Commit types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`; scope = feature or module; ticket key at the end, e.g. `feat(cvs): add CV table (KAN-44)`.
- A step is done when `lint`, `typecheck`, `format:check` pass, its **unit tests and component tests** (§11) are written and pass, `build` passes if routes or config changed, the step's acceptance criteria (docs AC IDs) are met, and this file is updated.
- New user-facing text goes to the feature's `messages/en.json`; other languages may start as copies.

---

## 6. Routes

| Route | Page (docs) | Access |
|---|---|---|
| `/sign-in` | sign-in | public (signed-in → `/cvs`) |
| `/sign-up` | sign-up | public |
| `/verify-email` | verification | signed-in, unverified |
| `/forgot-password` | forgot-password | public |
| `/reset-password?token=` | reset-password | public with valid token |
| `/` | redirect → `/cvs` (O3) | — |
| `/cvs` | cvs | all |
| `/cvs/[cvId]` → `/details` · `/skills` · `/projects` · `/preview` | cv-details, cv-skills, cv-projects, cv-preview | owner or admin |
| `/users` | users ("Employees") | all |
| `/users/[userId]` → `/profile` · `/skills` · `/languages` · `/cvs` | user-profile, user-skills, user-languages, user-cvs | all (edit: owner or admin; CVs tab: admin) |
| `/skills` | skills (own) | all |
| `/languages` | languages (own) | all |
| `/settings` | settings | all |
| `/admin/skills` · `/admin/languages` · `/admin/departments` · `/admin/positions` · `/admin/projects` | catalogs | admin |
| any other | not-found | all |

Sidebar: Employees, CVs, Skills, Languages; Admin group (admin only): Skills, Languages, Departments, Positions, Projects. Profile menu: Profile, Settings, Logout.

---

## 7. Data model (Prisma)

| Model | Fields | Rules (docs) |
|---|---|---|
| User | id, email unique, passwordHash, role `ADMIN`/`EMPLOYEE`, isVerified, firstName, lastName (≤100), avatarUrl?, departmentId?, positionId?, createdAt | createdAt = "Member since" |
| Department | id, name unique | delete blocked when referenced |
| Position | id, name unique | delete blocked when referenced (O5) |
| SkillCategory | id, name, type | seeded (O6) |
| Skill | id, name unique, categoryId | type comes from category |
| UserSkill | userId + skillId (unique), mastery `BEGINNER` `ELEMENTARY` `INTERMEDIATE` `ADVANCED` `EXPERT` | |
| Language | id, name unique, iso unique (2, upper), nativeName | |
| UserLanguage | userId + languageId (unique), proficiency `A1` `A2` `B1` `B2` `C1` `C2` `NATIVE` | |
| Project | id, name (≤100), domain (≤100), startDate, endDate, description (≤2000), environment → Skill[] | endDate ≥ startDate |
| ProjectRole | id, name | seeded (O7) |
| Cv | id, name (≤255), education (≤255), description, userId | |
| CvSkill | cvId + skillId (unique) | skill must be in owner's skills |
| CvProject | id, cvId, projectId, startDate, endDate?, responsibilities?, roles → ProjectRole[] (≥1) | dates within project dates |
| VerificationCode | userId, codeHash, expiresAt | 6 digits, 2 h |
| PasswordResetToken | userId, tokenHash, expiresAt | |
| RefreshToken | userId, tokenHash, expiresAt | deleted on sign-out |

Seed: 1 admin, 2 employees, departments, positions, skill categories + ~40 skills, 9+ languages, project roles, ~6 projects, sample CVs.

---

## 8. Permissions

| Action | Employee | Admin |
|---|---|---|
| View users list and any profile / skills / languages | ✓ | ✓ |
| Edit profile, avatar, own skills / languages | own only | any user |
| Verify email | own only | own only |
| Create / update / delete users | — | ✓ |
| User Details → CVs tab | — | ✓ |
| CVs: view, create, update, delete, skills, projects, preview, PDF | own only | any |
| Catalogs (skills, languages, departments, positions, projects) | — | ✓ |
| Settings (theme, language, change password) | ✓ | ✓ |

---

## 9. Roadmap

Owner split (keeps the KAN-4 ownership): **R** = Rafał, **M** = Maciej.

**Every step ships with its tests** — unit tests for its utils, hooks and services, and component tests for every component it adds (§11). A step without tests is not done.

### Phase 0 — Foundation (2026-10-27 → 11-02)

- [x] **S0.0 Repo baseline** · KAN-12 · R · PR #1
  TS-only configs, strict lint, Prettier, Husky + lint-staged + commitlint, `.gitattributes`, fractal skeleton, `(auth)`/`(app)` groups, README structure.

- [ ] **S0.1 Database and local infra** · KAN-13 (rewrite) · M
  - Docker Compose: PostgreSQL + Mailpit; `.env.example` with `DATABASE_URL`.
  - Prisma: full schema from §7, first migration, `seed.ts` (§7 seed), scripts `db:migrate`, `db:seed`, `db:reset`.
  - README: local setup.
  - Done when: both developers run `docker compose up` + migrate + seed from README.

- [ ] **S0.2 GraphQL server** · NEW · M
  - `src/server/` skeleton (§4), `server/env.ts`, `db.ts`, `context.ts` (user from cookie, unauthenticated allowed).
  - Apollo Server in `app/api/graphql/route.ts`; error codes and field errors (§3); pagination / sort / search helpers in `server/lib`.
  - GraphQL Code Generator (`codegen.ts`, `npm run codegen`): resolver types + typed documents.
  - First module: `departments` query only (proves the chain).
  - Done when: `departments` query works at `/api/graphql`; generated types compile.
  - Depends on: S0.1.

- [ ] **S0.3 Apollo Client** · KAN-14 · M
  - `shared/apollo/`: server client with `SchemaLink`, browser client with `HttpLink`, provider in root layout.
  - Error link: network errors → No Internet state; `UNAUTHENTICATED` → redirect to `/sign-in`.
  - Done when: a Server Component and a Client Component both render `departments`.
  - Depends on: S0.2.

- [ ] **S0.4 Theme + client store** · KAN-15 · R
  - Theme tokens from Figma, light/dark palettes; mode Light / Dark / Device in TanStack Store, persisted in a cookie read on the server (no flash).
  - Store accessed only via hooks (`useThemeMode`); store logic as tested pure utils.
  - Done when: switching persists after refresh without flash; tests pass.

- [ ] **S0.5 i18n** · KAN-16 · R
  - next-intl, 9 locales (en complete, others copies), locale in cookie + store, per-feature `messages/` merged at load.
  - Done when: language switch changes texts and persists.
  - Depends on: S0.4.

- [ ] **S0.6 Test setup** · KAN-17 · M
  - Vitest for **unit tests** and React Testing Library + user-event for **component tests** (jsdom), coverage-v8 (threshold 80 %, excludes generated/config); test utils (render with theme + Apollo `MockedProvider` + intl).
  - Separate test database for service tests; Playwright config + seeded run; scripts `test`, `test:coverage`, `test:e2e`.
  - Done when: one sample test per level runs in CI-like local command.

- [ ] **S0.7 Shared table, menu, states** · KAN-18 · R
  - `DataTable` (columns, sort indicator, pagination, search slot, row actions slot), `RowActionsMenu` (one open, Escape/outside close), `PageState` (loading skeleton, empty, no results, error + retry), `SearchField` (debounced).
  - Done when: story-like test page + unit tests.

- [ ] **S0.8 Shared forms and modals** · KAN-19 · M
  - `FormModal` (focus trap, Escape, primary disabled until valid/dirty), `ConfirmModal`, fields: Text, Password (toggle), Select, MultiSelect/Tags, Date, Textarea, OTP; `SelectionToolbar` ("REMOVE (n)"). RHF + Zod integration helpers; mapping of server field errors.
  - Done when: unit tests for each.

- [ ] **S0.9 App layout** · KAN-20 · R
  - `(app)` layout: sidebar by role (§6), active item, profile section + menu (Profile / Settings / Logout), breadcrumbs, tabs component, Device Error gate (< 768 px, live on resize).
  - Done when: navigation works with seeded admin/employee (after S1.1) or mocked user.
  - Depends on: S0.4.

- [ ] **S0.10 Auth core and route protection** · KAN-21 · M
  - `server/lib`: argon2, JWT (`jose`), cookies, `requireUser`, `requireAdmin`, `requireOwnerOrAdmin`; `me` query; refresh + sign-out.
  - `proxy.ts`: no session → `/sign-in`; signed-in on auth pages → `/cvs`; admin-only routes.
  - Done when: guards unit-tested; protected route redirects.
  - Depends on: S0.2.

- [ ] **S0.11 Mail** · NEW · M
  - `server/lib/mail`: Nodemailer transport (Mailpit / Resend), templates: verification code, password reset link.
  - Done when: mails visible in Mailpit.

- [ ] **S0.12 Deploy** · KAN-55 (+ replaces KAN-54) · R
  - Vercel project from GitHub, Neon database, env vars (§10), `prisma migrate deploy` on build, seed demo data, preview deployments.
  - Done when: production URL serves the app with data; URL in README.
  - Depends on: S0.2.

### Phase 1 — Authorisation (11-03 → 11-09) · M

- [ ] **S1.1 Sign In** · KAN-22 — API `signIn`; UI tabs, validation, password toggle, errors ("Invalid email or password"). AC: sign-in AC-1…13.
- [ ] **S1.2 Sign Up** · KAN-23 — API `signUp` (unique email, hash, send code); UI with confirm password; redirect `/verify-email`. AC: sign-up AC-1…13. Depends on S0.11.
- [ ] **S1.3 Email Verification** · KAN-24 — API `verifyEmail`, `resendVerification` (6 digits, 2 h); UI `OtpField`, CONFIRM, LATER → `/cvs`. AC: verification AC-1…13.
- [ ] **S1.4 Forgot Password** · KAN-25 — API `forgotPassword` (token + mail); UI. AC: forgot-password AC-1…10.
- [ ] **S1.5 Reset Password** · KAN-26 — API `resetPassword` (token check, expiry, auto sign-in); UI. AC: reset-password AC-1…15.

### Phase 2 — System pages, settings, catalogs (11-03 → 11-16)

- [ ] **S2.1 Not Found** · KAN-27 · R — `not-found.tsx`, GO BACK. AC 1–7.
- [ ] **S2.2 No Internet** · KAN-28 · R — screen from Apollo error link / offline, RETRY refetches. AC 1–7.
- [ ] **S2.3 Device Error** · KAN-29 · R — gate from S0.9 finalized with illustration/message. AC 1–5.
- [ ] **S2.4 Settings** · KAN-30 · R — theme + language selects (S0.4/S0.5), API `changePassword` (current password check). AC 1–14.
- [ ] **S2.5 Departments** · KAN-41 · R — module `departments` CRUD (unique, delete blocked when used); page `/admin/departments`. AC 1–17.
- [ ] **S2.6 Positions** · KAN-42 · R — same pattern as S2.5. AC per positions page.
- [ ] **S2.7 Skills catalog** · KAN-38 · R — module `skills` CRUD + `skillCategories`; type from category; unique name; page `/admin/skills`. AC 1–20.
- [ ] **S2.8 Languages catalog** · KAN-40 · R — module `languages` CRUD; ISO uppercase, unique name/ISO; page `/admin/languages`. AC 1–21.
- [ ] **S2.9 Projects catalog** · KAN-43 · M — module `projects` CRUD + `projectRoles`; date rule; environment as skill tags; search name/domain; sort name/start/end; page `/admin/projects`. AC 1–24.

### Phase 3 — Users (11-10 → 11-23) · R (S3.6 M)

- [ ] **S3.1 Users list** · KAN-31 — module `users` (list search name/email, sort, page; create/update/delete admin); page `/users` with admin modals. AC 1–24. Depends on S2.5, S2.6.
- [ ] **S3.2 User Details shell** · KAN-32 — `/users/[userId]` layout, tabs (CVs admin only), breadcrumbs, permission context (`canEdit`). Depends on S3.1.
- [ ] **S3.3 Profile + avatar + verify** · KAN-33 — API `updateProfile`, `uploadAvatar` (PNG/JPG/JPEG/GIF, ≤ 5 MB, Vercel Blob), `resendVerification` reuse; UI read-only vs editable. AC 1–22.
- [ ] **S3.4 Skills (own page + user tab)** · KAN-37 + KAN-34 — module `users/skills`; `features/skills` list grouped by category, add/update/remove with selection mode; used by `/skills` and the tab. AC skills 1–17, user-skills 1–21. Depends on S2.7.
- [ ] **S3.5 Languages (own page + user tab)** · KAN-39 + KAN-35 — module `users/languages`; same pattern. AC languages, user-languages 1–21. Depends on S2.8.
- [ ] **S3.6 User CVs tab** · KAN-36 · M — reuses CVs list from S4.1 filtered by user; create assigns to that user. AC 1–22. Depends on S4.1.

### Phase 4 — CVs (11-17 → 11-30) · M

- [ ] **S4.1 CVs list** · KAN-44 — module `cvs` (own vs all, search name / +email for admin, sort, page, CRUD); page `/cvs`. AC 1–22.
- [ ] **S4.2 CV Details shell + form** · KAN-45 — `/cvs/[cvId]` layout, tabs, breadcrumbs; Details form (dirty-check UPDATE). AC 1–15.
- [ ] **S4.3 CV Skills** · KAN-46 — module `cvs/skills` (only owner's skills, no duplicates); reuses `features/skills` list. AC per cv-skills.
- [ ] **S4.4 CV Projects** · KAN-47 — module `cvs/projects` (dates within project, ≥ 1 role); add/update modal with auto-filled read-only project fields. AC 1–27. Depends on S2.9.
- [ ] **S4.5 CV Preview** · KAN-48 — `cvPreview` data; pure utils: experience years (earliest project start → now, floor), last used (latest end or current year), unique domains, `MM.YYYY - Present`; preview layout. AC 1–19, 23–29.
- [ ] **S4.6 Export PDF** · KAN-49 — `@react-pdf/renderer` document matching preview, file name from CV name, disabled when no data. AC 20–22, 26.

### Phase 5 — Quality and delivery (12-01 → 12-07)

- [ ] **S5.1 E2E — Rafał's areas** · KAN-50 · R — layout, system pages, settings, users, skills, languages, departments, positions.
- [ ] **S5.2 E2E — Maciej's areas** · KAN-51 · M — auth flows, CVs, CV tabs, preview/PDF, projects.
- [ ] **S5.3 Coverage ≥ 80 % + README** · KAN-52 · R+M — fill gaps; README: functionality, dependencies, startup, tests, E2E structure by test case, deployment + live URL.
- [ ] **S5.4 Demo** · KAN-53 · R+M — demo data seeded in production, script (≤ 30 min), likely mentor questions.

---

## 10. Environment variables

| Variable | File | Purpose |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | `src/env.ts` | Absolute links in emails |
| `DATABASE_URL` | `src/server/env.ts` | PostgreSQL |
| `JWT_SECRET` | `src/server/env.ts` | Token signing |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | `src/server/env.ts` | Mail |
| `BLOB_READ_WRITE_TOKEN` | `src/server/env.ts` | Avatar upload |

`NEXT_PUBLIC_API_URL` is removed (API is same-origin `/api/graphql`).

---

## 11. Testing plan

Required by the task (Notion): **unit tests and component tests** with React Testing Library + Vitest, coverage over 80 %. Extra: E2E with Playwright.

### 11.1 Unit tests (Vitest)

Test logic in isolation, without rendering UI.

| What | Examples | Where |
|---|---|---|
| Utils | Zod schemas, CV preview calculations (experience years, last used, unique domains, `MM.YYYY - Present`), date and sort helpers, store logic | `x.utils.test.ts` next to the util |
| Hooks | feature hooks with Apollo `MockedProvider`: loading / data / error, handlers call the right mutation | `useX.test.ts` next to the hook |
| Server services | permissions (own vs admin), uniqueness, date rules, delete restrictions, token expiry | `<module>.test.ts` in `server/modules/**`, against the test DB |

### 11.2 Component tests (React Testing Library + Vitest)

Render a component the way a user sees it and interact through `user-event`; query by role/label, not by class names.

| What | Examples |
|---|---|
| Rendering from props | table shows the docs columns, profile shows read-only email |
| States | loading skeleton, empty message, error with RETRY, no search results |
| Interactions | sort header toggles direction, menu closes on Escape, OTP moves focus and accepts paste, selection mode shows "REMOVE (n)" |
| Forms | inline validation messages from docs, primary button disabled until valid / changed, values kept after a failed request |
| Permissions in UI | buttons hidden for employees viewing another user |
| Accessibility basics | labels on fields, focus trapped in modals |

Every component in `features/` and `shared/components/` has a `Component.test.tsx` next to it. Test helper renders with theme, intl and `MockedProvider` (S0.6).

### 11.3 E2E tests (Playwright, extra)

Full flows per docs page against a seeded database, in `e2e/<area>/`; the structure by test case is listed in the README.

### 11.4 Coverage

Over 80 % over `src/`, excluding generated code, configs and `app/` route files. Checked with `npm run test:coverage` before every PR.

---

## 12. Progress log

| Date | Step | PR | Note |
|---|---|---|---|
| 2026-10-26 | S0.0 Repo baseline | #1 | Merged into `developement` |
