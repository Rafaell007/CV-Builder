// Runs before every test file (vitest.config.mts → setupFiles).
// Adds DOM matchers such as toBeInTheDocument() to expect().
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Vitest globals are off, so React Testing Library cannot clean up by itself; unmount after each test.
afterEach(() => {
  cleanup();
});
