# CV Builder

Full plan, stack, decisions and progress: [PLAN.md](PLAN.md). Read §0–§5 first, then only the step you work on.

Full-stack Next.js (App Router): MUI + TanStack Store + Apollo Client on the front, Apollo Server + Prisma (PostgreSQL) at `/api/graphql`. TypeScript only.

## Commands

- `npm run dev` — dev server, http://localhost:3000
- `npm run lint` — ESLint
- `npm run typecheck` — `tsc --noEmit`
- `npm run build` — production build

Run `lint` and `typecheck` after changes; run `build` only when touching config or routing.

## Where things are

- `src/app/` — routes only, thin wiring of containers
- `src/features/<name>/` — one folder per feature (component, hook, utils, types, tests, `components/`)
- `src/shared/` — code used across unrelated features (`theme/` exists)
- `src/env.ts` — the only place that reads `process.env`
- `docs/` — per-page requirements; start at [docs/README.md](docs/README.md)

## Rules (full text: [PLAN.md §5](PLAN.md#5-development-rules))

- Components are representational: props in, JSX out. Logic goes into composed hooks, pure typed utils.
- One responsibility per file; one exported component per file, named like the file.
- Fractal layout: children live inside the parent; shared code moves to the nearest common ancestor; import only via a folder's `index.ts`.
- Each feature folder and non-obvious shared component has a short `README.md`: purpose, exports, where used, `docs/` link. Simple components get none.
- No `.js` files, no `any`, no `process.env` outside `src/env.ts`.
- New env var: add to `.env.example`, `src/env.ts` (public) or `src/server/env.ts` (secrets), and Vercel settings.

## Working here

- Read only the `docs/pages/` file for the screen you are building; open its image in `docs/images/` only when layout details matter.
- Do not read or edit `package-lock.json`, `.next/`, `node_modules/`, `*.tsbuildinfo`.
- Next.js 16, MUI 9 and TanStack Store differ from older versions; check the official docs rather than relying on memory.
- Prefer targeted edits over rewriting whole files. Keep new code consistent with the neighbouring files.
- Not yet set up: Apollo Client / Server, Prisma + PostgreSQL, Vitest + RTL, Playwright, Vercel + Neon. Add them only in their PLAN.md §9 step.
