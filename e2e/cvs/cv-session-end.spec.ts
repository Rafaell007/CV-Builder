import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { createCvs, deleteCvsByName } from "../support/cvs";
import { signIn, USER_EMAIL } from "../support/signIn";

const PREFIX = "E2E Session end";
const ERROR_TEXT = "Failed to load CV details";
const IN_DOM_KEY = "cvErrorInDom";
const PAINTED_KEY = "cvErrorPainted";
const UNAUTHENTICATED = {
  errors: [{ message: "Sign in to continue", extensions: { code: "UNAUTHENTICATED" } }],
  data: null,
};

test.afterEach(async ({ context }) => {
  // The test ended the session, so sign in again to remove the CV.
  await signIn(context, USER_EMAIL);
  await deleteCvsByName(context, PREFIX);
});

/** Ends the session in the browser and opens the CV Details page. `signInDelayMs` slows the sign-in page. */
async function openWithEndedSession(context: BrowserContext, page: Page, signInDelayMs: number) {
  await signIn(context, USER_EMAIL);
  const [cvId = ""] = await createCvs(context, PREFIX, 1);

  // The cv query and the refresh both answer UNAUTHENTICATED.
  await page.route("**/graphql", async (route) => {
    const body = route.request().postDataJSON() as { operationName?: string; query?: string };
    const name = body.operationName ?? /(?:query|mutation)\s+(\w+)/.exec(body.query ?? "")?.[1];
    if (name === "Cv" || name === "Refresh") {
      // Without this the cookies stay valid and the proxy sends the user from sign-in on to /users.
      if (name === "Refresh") await context.clearCookies();
      await route.fulfill({ json: UNAUTHENTICATED });
      return;
    }
    await route.continue();
  });
  if (signInDelayMs > 0) {
    await page.route("**/sign-in", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, signInDelayMs));
      await route.continue();
    });
  }
  // sessionStorage survives the navigation, so the flags are readable on the sign-in page.
  // "In the DOM" is set at once. "Painted" is set only when the text is still there after two animation
  // frames, so the browser has drawn at least one frame with it.
  await page.addInitScript(
    ([text, domKey, paintedKey]) => {
      const shown = () => document.body?.innerText.includes(text as string) ?? false;
      new MutationObserver(() => {
        if (!shown()) return;
        sessionStorage.setItem(domKey as string, "yes");
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            if (shown()) sessionStorage.setItem(paintedKey as string, "yes");
          }),
        );
      }).observe(document, { childList: true, subtree: true, characterData: true });
    },
    [ERROR_TEXT, IN_DOM_KEY, PAINTED_KEY],
  );

  await page.goto(`/en/cvs/${cvId}/details`);
  await expect(page).toHaveURL(/\/en\/sign-in$/);
  return {
    inDom: await page.evaluate((key) => sessionStorage.getItem(key), IN_DOM_KEY),
    painted: await page.evaluate((key) => sessionStorage.getItem(key), PAINTED_KEY),
  };
}

for (const signInDelayMs of [0, 1000]) {
  test(`CV Details shows no error screen before the redirect, sign-in delayed ${signInDelayMs} ms`, async ({
    context,
    page,
  }, testInfo) => {
    const seen = await openWithEndedSession(context, page, signInDelayMs);
    testInfo.annotations.push({ type: "seen", description: JSON.stringify(seen) });
    console.log(`delay ${signInDelayMs} ms:`, JSON.stringify(seen));

    expect(seen.painted).toBeNull();
  });
}
