import path from "node:path";
import type { Linter } from "eslint";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import storybook from "eslint-plugin-storybook";
import tseslint from "typescript-eslint";

// Next.js presets ship with global file patterns; prefix them so they apply only to frontend/.
// Entries that only carry `ignores` are global ignores and must stay untouched.
function scopeToDir(configs: Linter.Config[], dir: string): Linter.Config[] {
  return configs.map((config) => {
    const isGlobalIgnore = config.ignores !== undefined && Object.keys(config).length <= 2;
    if (isGlobalIgnore) return config;

    const files = (config.files ?? ["**/*"]) as string[];
    return { ...config, files: files.map((pattern) => `${dir}/${pattern}`) };
  });
}

const eslintConfig = defineConfig([
  ...scopeToDir([...nextVitals, ...nextTs], "frontend"),
  // Story rules (*.stories.tsx) and addon checks (.storybook/main.ts): https://storybook.js.org/docs/configure/integration/eslint-plugin
  // The plugin types its rules with typescript-eslint types, which ESLint's Linter.Config rejects (even the docs example).
  ...scopeToDir(storybook.configs["flat/recommended"] as Linter.Config[], "frontend"),
  {
    // The rule resolves the path from the folder ESLint runs in (root for lint-staged, frontend/ for `pnpm lint`),
    // so pass an absolute one.
    files: ["frontend/.storybook/main.ts"],
    rules: {
      "storybook/no-uninstalled-addons": [
        "error",
        { packageJsonLocation: path.join(import.meta.dirname, "frontend", "package.json") },
      ],
    },
  },
  {
    files: ["backend/**/*.ts", "e2e/**/*.ts"],
    extends: [tseslint.configs.recommended],
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  globalIgnores([
    "**/.next/**",
    "**/out/**",
    "**/build/**",
    "**/coverage/**",
    "**/dist/**",
    "**/next-env.d.ts",
    "**/generated/**",
    "**/playwright-report/**",
    "**/test-results/**",
    "**/storybook-static/**",
  ]),
]);

export default eslintConfig;
