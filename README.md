# CV Builder

Full-stack CV Builder: employees maintain their profile, skills and languages and build CVs from projects; admins manage users and global catalogs. Frontend and GraphQL backend live in one Next.js app.

Plan, stack, decisions, coding rules and progress: [PLAN.md](PLAN.md). Per-page requirements: [docs/](docs/README.md).

## Tech stack

| Area | Library | Status |
|---|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript strict | installed |
| UI | Material UI 9 + Emotion | installed |
| Client state | TanStack Store | installed |
| Server data | Apollo Client + Apollo Server (`/api/graphql`) | planned |
| Database | PostgreSQL + Prisma | planned |
| Tests | Vitest + React Testing Library, Playwright (E2E) | planned |
| Quality | ESLint, Prettier, Husky + lint-staged, commitlint | installed |
| Hosting | Vercel + Neon | planned |

## Getting started

Requirements: Node.js 20+ and npm.

```bash
npm ci
cp .env.example .env   # then adjust the values
npm run dev
```

The app runs at http://localhost:3000.

### Environment variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_APP_URL` | Public URL of the app (absolute links in emails) |

Public variables are read only in [src/env.ts](src/env.ts); server secrets will be read only in `src/server/env.ts`. The app fails fast if one is missing.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Generate Next.js route types and run the TypeScript compiler |
| `npm run format` | Format all files with Prettier |
| `npm run format:check` | Check formatting without changing files |

## Project structure

```
src/
  app/            # Next.js routes, thin: only wire containers
    (auth)/       # public routes
    (app)/        # protected routes
  features/       # one folder per feature, same shape at every level
  shared/         # code used across unrelated features (components, hooks, utils, theme)
  env.ts          # the only place that reads public environment variables
```

Details: [src/features/README.md](src/features/README.md) and [PLAN.md §4](PLAN.md#4-project-structure-fractal).

## Workflow

- Branches: `main` (releases), `development` (integration), feature branches from `development`; pull requests go into `development`.
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/), e.g. `feat(cvs): add CV table`.
- Git hooks (Husky, installed by `npm ci`): ESLint and Prettier run on staged files; commitlint checks the message.

## Unit tests

Not set up yet. Once added: `npm test`, coverage with `npm run test:coverage` (target: over 80 %).

## Deployment

Vercel (app + API) with a Neon PostgreSQL database. Live URL: _to be added after the first deploy._
