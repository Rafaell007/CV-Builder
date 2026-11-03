import { expect, test, type Page } from "@playwright/test";
import { createAccount, newEmail } from "../support/account";
import { findMails, findResetToken } from "../support/mailpit";

const CONFIRMATION =
  "If an account with this email exists, you will receive password reset instructions.";

const resetPassword = (page: Page) => page.getByRole("button", { name: "Reset password" });

test.beforeEach(async ({ page }) => {
  await page.goto("/forgot-password");
});

test("shows the title, the subtitle and the email field to a signed-out user", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Forgot password" })).toBeVisible();
  await expect(page.getByText("We will send you an email with further instructions")).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
});

test("CANCEL leads to the sign-in page", async ({ page }) => {
  await page.getByRole("link", { name: "Cancel" }).click();

  await expect(page).toHaveURL(/\/sign-in$/);
});

test("shows validation messages and sends nothing for an invalid email", async ({ page }) => {
  await resetPassword(page).click();
  await expect(page.getByText("Email is required")).toBeVisible();

  await page.getByLabel("Email").fill("not-an-email");
  await expect(page.getByText("Please enter a valid email address")).toBeVisible();
  await expect(page.getByRole("status")).toHaveCount(0);
});

test("a known email gets the confirmation and a mail with a reset link", async ({
  page,
  request,
}) => {
  const email = newEmail("forgot");
  await createAccount(request, email, "Password123!");

  await page.getByLabel("Email").fill(email);
  await resetPassword(page).click();

  await expect(page.getByRole("status")).toHaveText(CONFIRMATION);
  await expect(page.getByLabel("Email")).toHaveCount(0);
  // The "done when" of the ticket: the link arrives in Mailpit.
  await expect.poll(() => findResetToken(email), { timeout: 10_000 }).toMatch(/^[\w-]{20,}$/);
});

test("an unknown email gets the same confirmation and no mail", async ({ page }) => {
  const email = newEmail("unknown");

  await page.getByLabel("Email").fill(email);
  await resetPassword(page).click();

  await expect(page.getByRole("status")).toHaveText(CONFIRMATION);
  // Mails are sent after the answer, so wait a moment before checking that none came.
  await page.waitForTimeout(1_000);
  expect(await findMails(email)).toHaveLength(0);
});

test("shows the page in Polish and keeps the language on its links", async ({ page }) => {
  await page.goto("/pl/forgot-password");

  await expect(page.getByRole("heading", { name: "Nie pamiętasz hasła" })).toBeVisible();
  await page.getByRole("button", { name: "Zresetuj hasło" }).click();
  await expect(page.getByText("E-mail jest wymagany")).toBeVisible();

  await page.getByRole("link", { name: "Anuluj" }).click();
  await expect(page).toHaveURL(/\/pl\/sign-in$/);
});
