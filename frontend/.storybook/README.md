# Storybook

Storybook 10 shows components one at a time, outside the app, in light and dark. Every story is also a test. Plan: [PLAN.md §9 S0.4](../../PLAN.md).

## Run

- `pnpm storybook` (from the repo root) opens http://localhost:6006.
- `pnpm --filter @cv-builder/frontend test` runs the stories as tests in headless Chromium, together with the unit tests. Install the browser once per machine: `pnpm --filter @cv-builder/frontend exec playwright install chromium`.
- `pnpm --filter @cv-builder/frontend build-storybook` builds a static copy into `storybook-static/` (git-ignored).

## Files

- `main.ts`: framework (`@storybook/nextjs-vite`), where stories are found, addons.
- `preview.tsx`: applies to every story: global styles and tokens, the Roboto font, the light/dark toolbar switcher (`@storybook/addon-themes`, sets `<html data-theme>`).
- `ThemeSample/`: Storybook-only sample story; delete it once real component stories exist.

## Writing a story

Put `X.stories.tsx` next to the component in `src/`. Name stories after the state they show; use `globals: { theme: "dark" }` to force a theme and a `play` function for checks (`expect` from `storybook/test`). See `ThemeSample/ThemeSample.stories.tsx`.

Every story runs as a test (smoke render plus its `play` function). To leave one out, add `tags: ["!test"]`.

Docs: [Storybook for Next.js (Vite)](https://storybook.js.org/docs/get-started/frameworks/nextjs-vite) · [Vitest addon](https://storybook.js.org/docs/writing-tests/integrations/vitest-addon) · [Themes](https://storybook.js.org/docs/essentials/themes)
