import type { Locator } from "@playwright/test";

/**
 * Waits until React has hydrated `element`, so a click or a key press reaches its handler. A key press or click that
 * arrives earlier is lost. The list pages render on the server (PLAN D6): their rows and buttons are visible before
 * React takes them over, a little after the page loaded, so a test waits for this before it acts.
 */
export async function waitForHydration(element: Locator): Promise<void> {
  await element.evaluate(
    (node) =>
      new Promise<void>((resolve) => {
        const hydrated = () => Object.keys(node).some((key) => key.startsWith("__reactProps"));
        const check = () => (hydrated() ? resolve() : setTimeout(check, 50));
        check();
      }),
  );
}
