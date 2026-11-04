// Runs before every test file (vitest.config.mts → setupFiles).
// Adds DOM matchers such as toBeInTheDocument() to expect().
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// jsdom lacks pointer capture and scrollIntoView, which Radix Select calls on open and on keyboard moves.
// No-op stand-ins; real browsers (the Storybook tests) use the real ones.
// https://github.com/radix-ui/primitives/issues/1822
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.setPointerCapture ??= () => {};
Element.prototype.releasePointerCapture ??= () => {};
Element.prototype.scrollIntoView ??= () => {};

// Vitest globals are off, so React Testing Library cannot clean up by itself; unmount after each test.
afterEach(() => {
  cleanup();
});
