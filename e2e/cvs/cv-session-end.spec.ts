import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { createCvs, deleteCvsByName } from "../support/cvs";
import { signIn, USER_EMAIL } from "../support/signIn";

const PREFIX = "E2E Session end";
// The error text of each tab. The Retry button belongs to the same error screen, so one text covers both.
const ERROR_TEXT = {
  details: "Failed to load CV details",
  preview: "Failed to load CV preview",
} as const;
const PAINTED_KEY = "cvErrorPainted";

test.afterEach(async ({ context }) => {
  // The test ended the session, so sign in again to remove the CV.
  await signIn(context, USER_EMAIL);
  await deleteCvsByName(context, PREFIX);
});

/**
 * Ends the session for real (no access cookie, a refresh cookie that the backend refuses) and opens a CV page.
 * No answer is made up: the proxy asks the backend, the backend refuses, and the session ends.
 * `signInDelayMs` slows the sign-in page, so a flash of an error screen would have time to show.
 */
async function openWithDeadSession(
  context: BrowserContext,
  page: Page,
  tab: keyof typeof ERROR_TEXT,
  baseURL: string,
  signInDelayMs: number,
) {
  await signIn(context, USER_EMAIL);
  const [cvId = ""] = await createCvs(context, PREFIX, 1);
  await context.clearCookies({ name: "access_token" });
  await context.clearCookies({ name: "refresh_token" });
  await context.addCookies([{ name: "refresh_token", value: "dead", url: baseURL }]);

  if (signInDelayMs > 0) {
    await page.route("**/sign-in", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, signInDelayMs));
      await route.continue();
    });
  }
  // sessionStorage survives the navigation, so the flags are readable on the sign-in page.
  // The flag is set only when the text is still there after two animation frames,
  // so the browser has drawn at least one frame with it.
  await page.addInitScript(
    ([text, paintedKey]) => {
      const shown = () => document.body?.innerText.includes(text as string) ?? false;
      new MutationObserver(() => {
        if (!shown()) return;
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            if (shown()) sessionStorage.setItem(paintedKey as string, "yes");
          }),
        );
      }).observe(document, { childList: true, subtree: true, characterData: true });
    },
    [ERROR_TEXT[tab], PAINTED_KEY],
  );

  await page.goto(`/en/cvs/${cvId}/${tab}`);
  await expect(page).toHaveURL(/\/en\/sign-in$/);
  // The session really ended: the backend refused the refresh cookie and the proxy removed it.
  expect((await context.cookies()).map((cookie) => cookie.name)).not.toContain("refresh_token");
  return page.evaluate((key) => sessionStorage.getItem(key), PAINTED_KEY);
}

// A dead session never reaches a CV page: the proxy sends the user to sign-in before the page is rendered (KAN-174).
for (const tab of ["details", "preview"] as const) {
  for (const signInDelayMs of [0, 1000]) {
    test(`CV ${tab} shows no error screen before the redirect, sign-in delayed ${signInDelayMs} ms`, async ({
      context,
      page,
      baseURL,
    }) => {
      const painted = await openWithDeadSession(context, page, tab, baseURL ?? "", signInDelayMs);

      expect(painted).toBeNull();
    });
  }
}
