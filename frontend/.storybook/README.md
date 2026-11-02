# Storybook

Storybook 10 shows components one at a time, outside the app, in light, dark and system theme. Every story is also a test (render, `play` function, accessibility checks). Plan: [PLAN.md §9 S0.4](../../PLAN.md).

## Run

- `pnpm storybook` (from the repo root) opens http://localhost:6006.
- `pnpm --filter @cv-builder/frontend test` runs the stories as tests in headless Chromium, together with the unit tests. Install the browser once per machine: `pnpm --filter @cv-builder/frontend exec playwright install chromium`. The "Run tests" panel in the Storybook UI runs the same tests. The story tests load `next.config.ts`, which needs `BACKEND_URL`; `vitest.config.mts` reads it from `frontend/.env` or `.env.local` (Next.js itself skips `.env.local` in test mode).
- `pnpm --filter @cv-builder/frontend build-storybook` builds a static copy into `storybook-static/` (git-ignored).

## Files

- `main.ts`: framework (`@storybook/nextjs-vite`), where stories are found, addons (a11y, docs, vitest).
- `preview.tsx`: applies to every story: global styles and tokens, the Roboto font, the Theme toolbar (light / dark / system, from `THEMES`), accessibility checks that fail the test, a docs page per component.
- `withAppProviders.tsx`: global decorator; wraps every story in `PreferencesProvider` and Apollo `MockedProvider`, like `renderWithProviders` in unit tests. The toolbar theme is saved through `usePreferences().setTheme`, so the preferences store is the only thing that sets `<html data-theme>`.
- `ThemeSample/`: Storybook-only sample; its stories check that each theme applies the right `--color-bg` from `themes.css`.

## Writing a story

Put `X.stories.tsx` next to the component in `src/`. Name stories after the state they show. See `ThemeSample/ThemeSample.stories.tsx`.

- Theme: `globals: { theme: "dark" }` forces one (`"light" | "dark" | "system"`).
- Checks: a `play` function with `expect` from `storybook/test`.
- GraphQL: `parameters: { apollo: { mocks: [...] } }`, same mock format as `renderWithProviders` (`MockLink.MockedResponse`). A query without a mock gets an error.
- Accessibility: violations fail the test. For a known issue that must not block, use `parameters: { a11y: { test: "todo" } }` (warning only) and fix it in the same ticket.
- Opt-outs: `tags: ["!test"]` leaves a story out of the tests; `tags: ["!autodocs"]` leaves a component out of the docs pages.

Docs: [Storybook for Next.js (Vite)](https://storybook.js.org/docs/get-started/frameworks/nextjs-vite) · [Vitest addon](https://storybook.js.org/docs/writing-tests/integrations/vitest-addon) · [Toolbars and globals](https://storybook.js.org/docs/essentials/toolbars-and-globals) · [Decorators](https://storybook.js.org/docs/writing-stories/decorators) · [Accessibility tests](https://storybook.js.org/docs/writing-tests/accessibility-testing) · [Autodocs](https://storybook.js.org/docs/writing-docs/autodocs)
