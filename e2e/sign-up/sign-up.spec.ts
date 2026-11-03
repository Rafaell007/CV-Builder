import { expect, test, type Page } from "@playwright/test";
import { findMails } from "../support/mailpit";
import { USER_EMAIL } from "../support/signIn";

const PASSWORD = "Password123!";

// The database is seeded again at every run, but a spec can run twice against it (retries), so the email is unique.
function newEmail(): string {
  return `sign-up-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
}

async function fill(page: Page, email: string, password = PASSWORD, confirm = password) {
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm Password", { exact: true }).fill(confirm);
}

const createAccount = (page: Page) => page.getByRole("button", { name: "Create account" });

test.beforeEach(async ({ page }) => {
  await page.goto("/sign-up");
});

test("shows the sign-up page with the SIGN UP tab active", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Sign up now" })).toBeVisible();
  await expect(page.getByText("Welcome! Sign up to continue")).toBeVisible();
  await expect(page.getByRole("link", { name: "SIGN UP" })).toHaveAttribute("aria-current", "page");
});

test("SIGN IN and I HAVE AN ACCOUNT lead to the sign-in page", async ({ page }) => {
  await page.getByRole("link", { name: "SIGN IN" }).click();
  await expect(page).toHaveURL(/\/sign-in$/);

  await page.goto("/sign-up");
  await page.getByRole("link", { name: "I have an account" }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
});

test("shows validation messages and sends nothing for invalid values", async ({ page }) => {
  await createAccount(page).click();
  await expect(page.getByText("Email is required")).toBeVisible();
  await expect(page.getByText("Password is required", { exact: true })).toBeVisible();
  await expect(page.getByText("Confirm Password is required")).toBeVisible();

  await fill(page, "not-an-email", "12345", "123456");
  await expect(page.getByText("Please enter a valid email address")).toBeVisible();
  await expect(page.getByText("Password must be at least 6 characters long")).toBeVisible();
  await expect(page.getByText("Passwords do not match")).toBeVisible();
  await expect(page).toHaveURL(/\/sign-up$/);
});

test("the eye button shows and hides the password", async ({ page }) => {
  const password = page.getByLabel("Password", { exact: true });
  await expect(password).toHaveAttribute("type", "password");

  await page.getByRole("button", { name: "Show password" }).click();
  await expect(password).toHaveAttribute("type", "text");

  await page.getByRole("button", { name: "Hide password" }).click();
  await expect(password).toHaveAttribute("type", "password");
});

test("a used email shows an error and keeps the values", async ({ page }) => {
  await fill(page, USER_EMAIL);
  await createAccount(page).click();

  await expect(page.getByText("An account with this email already exists")).toBeVisible();
  await expect(page).toHaveURL(/\/sign-up$/);
  await expect(page.getByLabel("Email")).toHaveValue(USER_EMAIL);
  await expect(page.getByLabel("Password", { exact: true })).toHaveValue(PASSWORD);
  await expect(page.getByLabel("Confirm Password", { exact: true })).toHaveValue(PASSWORD);
});

test("creates an account, signs the user in and mails the code", async ({ page, context }) => {
  const email = newEmail();
  await fill(page, email);

  await createAccount(page).click();

  await expect(page).toHaveURL(/\/verify-email$/);
  const cookieNames = (await context.cookies()).map(({ name }) => name);
  expect(cookieNames).toEqual(expect.arrayContaining(["access_token", "refresh_token"]));

  // The "done when" of the ticket: the code arrives in Mailpit.
  await expect
    .poll(async () => (await findMails(email))[0]?.Text ?? "", { timeout: 10_000 })
    .toMatch(/\b\d{6}\b/);
  const [mail] = await findMails(email);
  expect(mail?.Subject).toBe("Your CV Builder verification code");
});

test("a signed-in user cannot open the sign-up page", async ({ page }) => {
  await fill(page, newEmail());
  await createAccount(page).click();
  await expect(page).toHaveURL(/\/verify-email$/);

  await page.goto("/sign-up");

  await expect(page).toHaveURL(/\/users$/);
});
