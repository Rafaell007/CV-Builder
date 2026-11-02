import type { StorybookConfig } from "@storybook/nextjs-vite";

// Storybook config: https://storybook.js.org/docs/api/main-config/main-config
const config: StorybookConfig = {
  // Vite-based Next.js framework (recommended; required by the Vitest addon).
  framework: "@storybook/nextjs-vite",
  // Globs are relative to this folder. Component stories live next to the component in src/;
  // Storybook-only samples live here.
  stories: ["../src/**/*.stories.tsx", "./**/*.stories.tsx"],
  addons: ["@storybook/addon-themes"],
};

export default config;
