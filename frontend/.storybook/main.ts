import type { StorybookConfig } from "@storybook/nextjs-vite";

// Storybook config: https://storybook.js.org/docs/api/main-config/main-config
const config: StorybookConfig = {
  // Vite-based Next.js framework (recommended; required by the Vitest addon).
  framework: "@storybook/nextjs-vite",
  // Globs are relative to this folder.
  stories: ["../src/**/*.stories.tsx"],
  addons: ["@storybook/addon-themes"],
};

export default config;
