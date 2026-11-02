import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
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
});
