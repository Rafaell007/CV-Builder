import path from "node:path";
import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  // The Storybook plugin loads next.config.ts, which needs BACKEND_URL. In test mode Next.js skips .env.local,
  // so load .env, .env.local, .env.test and .env.test.local here. Variables already set (CI) win over the files.
  // https://vite.dev/config/#using-environment-variables-in-config
  process.env = { ...loadEnv(mode, dirname, ""), ...process.env };

  return {
    plugins: [react()],
    resolve: {
      tsconfigPaths: true,
    },
    test: {
      // Two projects, both run by `pnpm test`. `extends: true` shares the plugins and resolve options above.
      projects: [
        {
          extends: true,
          test: {
            name: "unit",
            environment: "jsdom",
            setupFiles: ["./vitest.setup.ts"],
            // The first test of handleRequest.test.ts loads next-intl and Next.js cold, which takes more than
            // the default 5 s on a busy CI runner.
            testTimeout: 20_000,
            // next-intl imports `next/navigation` without an extension, which Node's ESM loader rejects;
            // inlining lets Vite resolve it. https://next-intl.dev/docs/environments/testing
            server: { deps: { inline: ["next-intl"] } },
          },
        },
        {
          // Every story tagged `test` (the default) renders in real Chromium and runs its play function.
          // https://storybook.js.org/docs/writing-tests/integrations/vitest-addon
          extends: true,
          plugins: [
            storybookTest({
              configDir: path.join(dirname, ".storybook"),
              storybookScript: "pnpm storybook --no-open",
            }),
          ],
          test: {
            name: "storybook",
            browser: {
              enabled: true,
              provider: playwright(),
              headless: true,
              instances: [{ browser: "chromium" }],
            },
          },
        },
      ],
      // Runs only with --coverage (`test:cov`); CI switches to it in Phase 3 (PLAN §9 S0.5, §11.5).
      coverage: {
        provider: "v8",
        // Listed explicitly so files without any test still count as uncovered.
        include: ["src/**/*.{ts,tsx}"],
        exclude: [
          "src/**/*.test.{ts,tsx}",
          "src/**/*.stories.tsx",
          "src/**/*.d.ts",
          "src/**/index.ts",
          "src/app/**",
          "src/shared/graphql/generated/**",
          "src/shared/testing/**",
        ],
        reporter: ["text", "html", "lcov"],
        thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
      },
    },
  };
});
