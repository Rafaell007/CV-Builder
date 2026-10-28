import type { Linter } from "eslint";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
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
  {
    files: ["backend/**/*.ts"],
    extends: [tseslint.configs.recommended],
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  globalIgnores(["**/.next/**", "**/out/**", "**/build/**", "**/dist/**", "**/next-env.d.ts"]),
]);

export default eslintConfig;
