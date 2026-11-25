import { expect, type Locator } from "@playwright/test";

/**
 * Waits until React has hydrated `element`, so a click or a key press reaches its handler. A key press or click that
 * arrives earlier is lost. The list pages render on the server (PLAN D6): their rows and buttons are visible before
 * React takes them over, a little after the page loaded, so a test waits for this before it acts. The element is
 * found again on every check, so a node that React replaced does not keep the test waiting.
 */
export async function waitForHydration(element: Locator): Promise<void> {
  await expect
    .poll(
      () =>
        element.evaluate((node) => Object.keys(node).some((key) => key.startsWith("__reactProps"))),
      { message: "React hydrates the element" },
    )
    .toBe(true);
}
