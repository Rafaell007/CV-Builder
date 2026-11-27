import type { StorybookConfig } from "@storybook/nextjs-vite";

// Storybook config: https://storybook.js.org/docs/api/main-config/main-config
const config: StorybookConfig = {
  // Vite-based Next.js framework (recommended; required by the Vitest addon).
  framework: "@storybook/nextjs-vite",
  // Globs are relative to this folder. Component stories live next to the component in src/;
  // Storybook-only samples live here.
  stories: ["../src/**/*.stories.tsx", "./**/*.stories.tsx"],
  addons: [
    // Axe checks in the Accessibility panel and in every story test.
    "@storybook/addon-a11y",
    // Generated docs pages (props table, all stories) for components tagged `autodocs` (all, via preview.tsx).
    "@storybook/addon-docs",
    // "Run tests" panel in the Storybook UI; the tests themselves come from the plugin in vitest.config.mts.
    "@storybook/addon-vitest",
  ],
};

export default config;
