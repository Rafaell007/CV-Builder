/// <reference lib="dom" />
// The functions below run in the browser, so this file needs the DOM types that the e2e package does not load.
import type { Page } from "@playwright/test";

type WindowWithCount = Window & { maxCopies?: number };

// The text of the part of the page that React streams in after the first HTML (`HealthStatus` in frontend/src/features/health).
const STREAMED_TEXT = "Backend health (server)";

/**
 * Call before `page.goto`. A MutationObserver records the highest number of copies of the streamed part that
 * the DOM ever held, hidden ones included (`getByRole` and `toBeVisible` ignore those). A check made at one
 * moment can miss the ~300 ms window in which a bug leaves two copies; this cannot.
 */
export async function startCountingPageCopies(page: Page) {
  await page.addInitScript((text) => {
    const win: WindowWithCount = window;
    win.maxCopies = 0;
    new MutationObserver(() => {
      const copies = Array.from(document.querySelectorAll("p")).filter((paragraph) =>
        paragraph.textContent?.includes(text),
      ).length;
      win.maxCopies = Math.max(win.maxCopies ?? 0, copies);
    }).observe(document, { childList: true, subtree: true });
  }, STREAMED_TEXT);
}

/** Waits until React has removed its hidden streaming copy (`div#S:n`), then returns the highest count seen. */
export async function readMaxPageCopies(page: Page): Promise<number> {
  await page.waitForFunction(() => document.querySelector('div[hidden][id^="S:"]') === null);
  const max = await page.evaluate(() => (window as WindowWithCount).maxCopies);
  return max ?? 0;
}
