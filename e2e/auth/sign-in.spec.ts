import { expect, test } from "@playwright/test";
import { PASSWORD, USER_EMAIL } from "../support/signIn";

// Smoke spec for the sign-in page (docs/pages/02-sign-in-page.md). Details are covered by the component tests.
test.describe("sign-in page", () => {
  test("shows the form with the Sign In tab active", async ({ page }) => {
    await page.goto("/sign-in");

    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(page.getByRole("button", { name: "Sign in" })).toBeDisabled();
  });

  test("signs a seeded user in and opens the employees page", async ({ page, context }) => {
    await page.goto("/sign-in");

    await page.getByLabel("Email", { exact: true }).fill(USER_EMAIL);
    await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/users$/);
    expect((await context.cookies()).map((cookie) => cookie.name)).toContain("access_token");
  });

  test("shows an error and keeps the typed values after a wrong password", async ({ page }) => {
    await page.goto("/sign-in");

    await page.getByLabel("Email", { exact: true }).fill(USER_EMAIL);
    await page.getByLabel("Password", { exact: true }).fill("wrong-password");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByText("Invalid email or password")).toBeVisible();
    await expect(page).toHaveURL(/\/sign-in$/);
    await expect(page.getByLabel("Email", { exact: true })).toHaveValue(USER_EMAIL);
    await expect(page.getByLabel("Password", { exact: true })).toHaveValue("wrong-password");
  });

  test("shows a message under a field that is left wrong", async ({ page }) => {
    await page.goto("/sign-in");

    await page.getByLabel("Email", { exact: true }).fill("not-an-email");
    await page.getByLabel("Password", { exact: true }).click();

    await expect(page.getByText("Please enter a valid email address")).toBeVisible();
  });

  test("opens the sign up and forgot password pages", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByRole("link", { name: "Forgot password" }).click();
    await expect(page).toHaveURL(/\/forgot-password$/);

    await page.goto("/sign-in");
    await page.getByRole("link", { name: "Sign up" }).click();
    await expect(page).toHaveURL(/\/sign-up$/);
  });
});
