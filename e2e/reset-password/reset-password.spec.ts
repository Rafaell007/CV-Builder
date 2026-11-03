import { expect, test, type Page } from "@playwright/test";
import { canSignIn, createAccount, newEmail } from "../support/account";
import { findResetToken } from "../support/mailpit";

const OLD_PASSWORD = "Password123!";
const NEW_PASSWORD = "NewPassword456!";

async function fill(page: Page, password: string, confirm = password) {
  await page.getByLabel("New Password").fill(password);
  await page.getByLabel("Confirm Password", { exact: true }).fill(confirm);
}

// Next.js adds its own role="alert" (the route announcer), so the page's message is found by its tag.
const alert = (page: Page) => page.locator("p[role=alert]");
const submit = (page: Page) => page.getByRole("button", { name: "Submit" });

test("shows the title, the subtitle and masked fields for a link with a token", async ({
  page,
}) => {
  await page.goto("/reset-password?token=anything");

  await expect(page.getByRole("heading", { name: "Reset password" })).toBeVisible();
  await expect(page.getByText("Here you should write a new password and confirm it")).toBeVisible();
  await expect(page.getByLabel("New Password")).toHaveAttribute("type", "password");
  await expect(page.getByLabel("Confirm Password", { exact: true })).toHaveAttribute(
    "type",
    "password",
  );
});

test("the eye button shows and hides the new password", async ({ page }) => {
  await page.goto("/reset-password?token=anything");
  const password = page.getByLabel("New Password");

  await page.getByRole("button", { name: "Show password" }).click();
  await expect(password).toHaveAttribute("type", "text");

  await page.getByRole("button", { name: "Hide password" }).click();
  await expect(password).toHaveAttribute("type", "password");
});

test("shows validation messages and sends nothing for invalid values", async ({ page }) => {
  await page.goto("/reset-password?token=anything");

  await submit(page).click();
  await expect(page.getByText("Password is required", { exact: true })).toBeVisible();
  await expect(page.getByText("Confirm Password is required")).toBeVisible();

  await fill(page, "PasswordOnly", "Different1");
  await expect(
    page.getByText("Password must contain at least one letter and one digit"),
  ).toBeVisible();
  await expect(page.getByText("Passwords do not match")).toBeVisible();
  await expect(page.getByRole("status")).toHaveCount(0);
  await expect(page.getByLabel("New Password")).toBeVisible();
});

test("GO TO SIGN IN leads to the sign-in page", async ({ page }) => {
  await page.goto("/reset-password?token=anything");

  await page.getByRole("link", { name: "Go to sign in" }).click();

  await expect(page).toHaveURL(/\/sign-in$/);
});

test("a link without a token shows the invalid notice and offers a new link", async ({ page }) => {
  await page.goto("/reset-password");

  await expect(alert(page)).toHaveText("This password reset link is invalid");
  await expect(page.getByLabel("New Password")).toHaveCount(0);

  await page.getByRole("link", { name: "Request a new link" }).click();
  await expect(page).toHaveURL(/\/forgot-password$/);
});

test("a token the backend does not know shows the invalid notice", async ({ page }) => {
  await page.goto("/reset-password?token=not-a-real-token");

  await fill(page, NEW_PASSWORD);
  await submit(page).click();

  await expect(alert(page)).toHaveText("This password reset link is invalid");
  await expect(page.getByLabel("New Password")).toHaveCount(0);
});

test("the link from the mail sets a new password, once", async ({ page, request }) => {
  const email = newEmail("reset");
  await createAccount(request, email, OLD_PASSWORD);

  // Ask for the link on the forgot-password page, then read it from Mailpit.
  await page.goto("/forgot-password");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Reset password" }).click();
  await expect(page.getByRole("status")).toBeVisible();
  await expect.poll(() => findResetToken(email), { timeout: 10_000 }).toBeTruthy();
  const token = await findResetToken(email);

  // The mail link points to FRONTEND_URL of the backend, so open the same path on the test frontend.
  await page.goto(`/reset-password?token=${token}`);
  await fill(page, NEW_PASSWORD);
  await submit(page).click();

  // The backend does not sign the user in, so the page leads to the sign-in page.
  await expect(page).toHaveURL(/\/sign-in$/);
  expect(await canSignIn(request, email, NEW_PASSWORD)).toBe(true);
  expect(await canSignIn(request, email, OLD_PASSWORD)).toBe(false);

  // The link works once.
  await page.goto(`/reset-password?token=${token}`);
  await fill(page, "AnotherPassword789!");
  await submit(page).click();
  await expect(alert(page)).toHaveText("This password reset link has already been used");

  await page.getByRole("link", { name: "Go to sign in" }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
});

test("shows the page in Polish and keeps the language on its links", async ({ page }) => {
  await page.goto("/pl/reset-password?token=anything");

  await expect(page.getByRole("heading", { name: "Resetowanie hasła" })).toBeVisible();
  await page.getByRole("button", { name: "Zatwierdź" }).click();
  await expect(page.getByText("Hasło jest wymagane")).toBeVisible();

  await page.getByRole("link", { name: "Przejdź do logowania" }).click();
  await expect(page).toHaveURL(/\/pl\/sign-in$/);
});
