# Frontend rules

Full text: [PLAN.md §5](../PLAN.md#5-development-rules).

- Components are representational: props in, JSX out. Logic goes into composed hooks and pure typed utils. Styling only with CSS Modules + design tokens.
- One responsibility per file; one exported component per file, named like the file.
- A file with a test is a folder: `X/` holds `X.ts(x)`, `X.test.ts(x)` and `index.ts` (role files by role: `x.utils.ts` → `utils/`, `x.store.ts` → `store/`). Files without a test stay plain. Example: `src/shared/preferences/`.
- Shared code moves to the nearest common ancestor. Import only via a folder's `index.ts` (exception: `messages/*.json`, imported directly by `src/i18n/loadMessages`).
- Each feature folder and non-obvious shared component has a short `README.md`: purpose, exports, where used, `docs/` link.
- `process.env` only in `src/env.ts` (public) and `src/server/env/env.ts` (server only). New env var: add to `.env.example` and PLAN.md §10.
- Tests render through `renderWithProviders` from `@/shared/testing`.
