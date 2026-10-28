# CV Builder

Full plan, stack, decisions and progress: [PLAN.md](PLAN.md). Read §0–§5 first, then only the step you work on.

pnpm monorepo (Node 24): `frontend/` = Next.js 16 + Apollo Client 4 + Radix UI + CSS Modules; `backend/` = NestJS 11 + GraphQL code-first + Prisma 7 + PostgreSQL 17. TypeScript only.

> The repo is still a single Next.js app with MUI until PLAN.md step S0.1 restructures it.

## Commands (after S0.1)

- `pnpm dev` — both apps (frontend http://localhost:3000, backend http://localhost:4000/graphql)
- `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm format:check` · `pnpm build`
- `docker compose up -d` — PostgreSQL + Mailpit

Run `lint`, `typecheck` and the tests of the app you changed.

## Where things are

- `frontend/src/app/` — routes only; `frontend/src/features/<name>/` — one folder per feature; `frontend/src/shared/` — UI kit, styles, apollo, utils
- `backend/src/modules/<name>/` — one Nest module per domain; `backend/src/common/` — guards, filters, pagination; `backend/prisma/` — schema, migrations, seed
- `backend/schema.gql` — generated GraphQL contract; the frontend generates its types from it
- `docs/pages/` — per-page requirements; `docs/images/` — designs

## Rules (full text: [PLAN.md §5](PLAN.md#5-development-rules))

- Frontend components are representational: props in, JSX out. Logic goes into composed hooks and pure typed utils. Styling only with CSS Modules + design tokens.
- Backend resolvers are thin; services hold business rules, ownership checks and Prisma calls. Inputs validated with class-validator. Authorization on the backend.
- One responsibility per file; one exported component per file, named like the file.
- Fractal layout: children live inside the parent; shared code moves to the nearest common ancestor; frontend imports only via a folder's `index.ts`.
- Each feature folder and non-obvious shared component has a short `README.md`: purpose, exports, where used, `docs/` link. Simple components get none.
- No `.js` files, no `any`. `process.env` only in `frontend/src/env.ts` and the backend config module.
- New env var: add to the app's `.env.example` and PLAN.md §10.
- Contract changes (`schema.gql`) are called out in the PR and agreed with the frontend side.

## Working here

- Read only the `docs/pages/` file for the screen you are building; open its image in `docs/images/` only when layout details matter.
- Do not read or edit lockfiles, `.next/`, `dist/`, `node_modules/`, `*.tsbuildinfo`, generated files.
- Next.js 16, NestJS 11, Prisma 7, Apollo Client 4 and Storybook 10 differ from older versions; check the official docs rather than relying on memory.
- Prefer targeted edits over rewriting whole files. Keep new code consistent with the neighbouring files.
