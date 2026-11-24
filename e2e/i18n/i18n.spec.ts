import { expect, test } from "@playwright/test";
import { signIn, USER_EMAIL } from "../support/signIn";

// Language in the URL (/en, /pl), remembered in the `locale` cookie (PLAN D27, S0.6).
// The selector comes with Settings (S4.4); `useLanguage().setLanguage` opens the same page under the new
// language, which is what these tests do by navigating.

test.describe("without a session", () => {
  test("a path without a language opens in English", async ({ page }) => {
    await page.goto("/sign-in");

    await expect(page).toHaveURL(/\/en\/sign-in$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });

  test("a redirect keeps the language", async ({ page }) => {
    await page.goto("/pl/users");

    await expect(page).toHaveURL(/\/pl\/sign-in$/);
  });

  test("an unknown page shows the not-found text in the language of the URL", async ({ page }) => {
    await page.goto("/pl/no-such-page");

    await expect(page.getByRole("button", { name: "Wróć" })).toBeVisible();
  });
});

test.describe("with a session", () => {
  test.beforeEach(async ({ context }) => {
    await signIn(context, USER_EMAIL);
  });

  test("switching to Polish changes the texts", async ({ page }) => {
    await page.goto("/en/users");
    await expect(page.getByRole("heading", { name: "Employees" })).toBeVisible();

    await page.goto("/pl/users");

    await expect(page.locator("html")).toHaveAttribute("lang", "pl");
    await expect(page.getByRole("heading", { name: "Pracownicy" })).toBeVisible();
    // The table name is Polish and the seeded admin's row loaded, so the page got its data in Polish.
    await expect(
      page
        .getByRole("table", { name: "Lista pracowników" })
        .getByRole("cell", { name: "Ada", exact: true })
        .first(),
    ).toBeVisible();
  });

  test("the chosen language stays after a refresh and on links without a language", async ({
    page,
  }) => {
    await page.goto("/pl/users");

    await page.reload();
    await expect(page.getByRole("heading", { name: "Pracownicy" })).toBeVisible();

    await page.goto("/users");
    await expect(page).toHaveURL(/\/pl\/users$/);

    await page.goto("/");
    await expect(page).toHaveURL(/\/pl\/users$/);
  });
});
