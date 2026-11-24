import { expect, test } from "@playwright/test";
import { signIn, USER_EMAIL } from "../support/signIn";
import { seededUserCell } from "../support/users";

// No Internet (S4.2, KAN-93): offline or a query that cannot reach the server shows "Oops" with RETRY.
// The page stays mounted but hidden, so it comes back as it was.
test.describe("no internet", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test.beforeEach(async ({ page, context }) => {
    await signIn(context, USER_EMAIL);
    await page.goto("/en/users");
    // The sidebar's `me` query runs in the browser; going offline before it ends would fail it too.
    await expect(page.getByRole("button", { name: /Jan Kowalski/ })).toBeVisible();
  });

  test("going offline shows the screen; going online shows the page again", async ({
    page,
    context,
  }) => {
    await context.setOffline(true);

    await expect(page.getByRole("heading", { level: 1, name: "Oops" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Employees" })).toBeHidden();

    await context.setOffline(false);

    await expect(page.getByRole("heading", { name: "Employees" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Oops" })).toBeHidden();
  });

  test("RETRY keeps the screen while queries fail and shows the page when they succeed", async ({
    page,
    context,
  }) => {
    await context.setOffline(true);
    const retry = page.getByRole("button", { name: "Retry" });

    // Offline, the refetch fails: the failed query keeps the screen even after the network is back.
    const failedRefetch = page.waitForEvent("requestfailed", (request) =>
      request.url().endsWith("/graphql"),
    );
    await retry.click();
    await failedRefetch;
    await context.setOffline(false);
    await expect(page.getByRole("heading", { level: 1, name: "Oops" })).toBeVisible();

    await retry.click();

    await expect(page.getByRole("heading", { name: "Employees" })).toBeVisible();
    await expect(seededUserCell(page)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Oops" })).toBeHidden();
  });
});
