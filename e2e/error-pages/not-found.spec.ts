import { expect, test } from "@playwright/test";
import { signIn, USER_EMAIL } from "../support/signIn";

// Not Found (S4.1, KAN-93): an unknown path shows "Hmm..."; GO BACK opens the previous page, or `/` when
// the tab has no previous page.
test.describe("not found", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("an unknown path shows the not-found screen", async ({ page }) => {
    await page.goto("/en/no-such-page");

    await expect(page.getByRole("heading", { level: 1, name: "Hmm..." })).toBeVisible();
    await expect(
      page.getByText("This doesn’t seem to be the page you were looking for."),
    ).toBeVisible();
  });

  test("GO BACK opens the previous page", async ({ page }) => {
    await page.goto("/en/sign-in");
    await page.goto("/en/no-such-page");

    await page.getByRole("button", { name: "Go back" }).click();

    await expect(page).toHaveURL(/\/en\/sign-in$/);
  });

  test("GO BACK without a previous page opens the start page", async ({ page, context }) => {
    await signIn(context, USER_EMAIL);
    await page.goto("/en/sign-in");

    // A link opened in a new tab: its history holds only that page. (A tab from `newPage` starts on
    // about:blank, which would count as a previous page.)
    const [newTab] = await Promise.all([
      page.waitForEvent("popup"),
      page.evaluate(() => window.open("/en/no-such-page")),
    ]);

    await newTab.getByRole("button", { name: "Go back" }).click();

    await expect(newTab).toHaveURL(/\/en\/users$/);
  });
});
