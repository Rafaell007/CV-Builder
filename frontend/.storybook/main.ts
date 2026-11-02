import type { StorybookConfig } from "@storybook/nextjs-vite";

// Storybook config: https://storybook.js.org/docs/api/main-config/main-config
const config: StorybookConfig = {
  // Vite-based Next.js framework (recommended; required by the Vitest addon).
  framework: "@storybook/nextjs-vite",
  // Globs are relative to this folder. Component stories live next to the component in src/;
  // Storybook-only samples live here.
  stories: ["../src/**/*.stories.tsx", "./**/*.stories.tsx"],
  // a11y: axe checks in the Accessibility panel and in every story test.
  addons: ["@storybook/addon-a11y"],
};

export default config;
