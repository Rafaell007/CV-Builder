# Backend rules

Full text: [PLAN.md §5](../PLAN.md#5-development-rules).

- Resolvers are thin: input → service → output. Services hold business rules, ownership checks and Prisma calls.
- Inputs are `@InputType` classes validated with class-validator. Authorization is on the backend (guards, ownership checks in services).
- One responsibility per file. Modules live in `src/modules/<name>/`; code shared by unrelated modules goes to `src/common/`.
- A module with several topics gets one sub-folder per topic (own `dto/`, `models/`, specs), e.g. `auth/sessions/`, `cvs/cv-projects/`. Integration tests live in `backend/test/<module>/`.
- `process.env` only in the config module `src/config/` (exceptions: `prisma.config.ts`, `prisma/seed.ts`, `prisma/check-seed-target.ts`). New env var: add to `.env.example` and PLAN.md §10.
- A change to `schema.gql` is called out in the PR and agreed with the frontend side.
