import { expect, test, type BrowserContext } from "@playwright/test";
import { ADMIN_EMAIL, signIn, USER_EMAIL } from "../support/signIn";
import { seededUserCell } from "../support/users";

async function cookieNames(context: BrowserContext): Promise<string[]> {
  return (await context.cookies()).map((cookie) => cookie.name);
}

test.describe("without a session", () => {
  test("a protected route redirects to sign-in", async ({ page }) => {
    await page.goto("/users");

    await expect(page).toHaveURL(/\/sign-in$/);
  });

  test("an admin-only route redirects to sign-in", async ({ page }) => {
    await page.goto("/admin/skills");

    await expect(page).toHaveURL(/\/sign-in$/);
  });

  test("the sign-in page opens", async ({ page }) => {
    await page.goto("/sign-in");

    await expect(page).toHaveURL(/\/sign-in$/);
  });
});

test.describe("with a session", () => {
  test("a signed-in user is sent from sign-in to the employees page", async ({ page, context }) => {
    await signIn(context, USER_EMAIL);

    await page.goto("/sign-in");

    await expect(page).toHaveURL(/\/users$/);
  });

  test("a user cannot open an admin-only route", async ({ page, context }) => {
    await signIn(context, USER_EMAIL);

    await page.goto("/admin/skills");

    await expect(page).toHaveURL(/\/users$/);
  });

  test("an admin can open an admin-only route", async ({ page, context }) => {
    await signIn(context, ADMIN_EMAIL);

    await page.goto("/admin/skills");

    await expect(page).toHaveURL(/\/admin\/skills$/);
  });

  test("an expired access token is refreshed before the page renders", async ({
    page,
    context,
  }) => {
    await signIn(context, USER_EMAIL);
    // The browser drops an access cookie when it expires after 15 minutes; the refresh cookie stays.
    await context.clearCookies({ name: "access_token" });
    expect(await cookieNames(context)).not.toContain("access_token");

    await page.goto("/users");

    await expect(page).toHaveURL(/\/users$/);
    // The list loads with the new access cookie.
    await expect(seededUserCell(page)).toBeVisible();
    expect(await cookieNames(context)).toContain("access_token");
  });

  test("a dead refresh token ends the session and clears the cookies", async ({
    page,
    context,
  }) => {
    await signIn(context, USER_EMAIL);
    await context.clearCookies({ name: "access_token" });
    await context.clearCookies({ name: "refresh_token" });
    await context.addCookies([
      { name: "refresh_token", value: "dead", url: "http://localhost:3100" },
    ]);

    await page.goto("/users");

    await expect(page).toHaveURL(/\/sign-in$/);
    expect(await cookieNames(context)).not.toContain("refresh_token");
  });
});
