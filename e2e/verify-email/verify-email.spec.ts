import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { waitForHydration } from "../support/hydration";
import { findVerificationCode } from "../support/mailpit";
import { signUp } from "../support/signUp";

// The page is only for a signed-in user who is not verified. signUp gives exactly that (the code is mailed).
async function openAsUnverifiedUser(page: Page, context: BrowserContext): Promise<string> {
  const email = await signUp(context);
  await page.goto("/verify-email");
  return email;
}

async function enterCode(page: Page, code: string) {
  // Digits typed before React has hydrated the boxes are lost, so wait until the first box is interactive.
  await waitForHydration(page.getByRole("textbox", { name: "Digit 1 of 6" }));
  await page.getByRole("textbox", { name: "Digit 1 of 6" }).click();
  await page.keyboard.type(code);
}

// The code comes from the mail the backend sent; Mailpit may need a moment to receive it.
async function readCode(email: string): Promise<string> {
  await expect.poll(() => findVerificationCode(email), { timeout: 10_000 }).toBeTruthy();
  return (await findVerificationCode(email)) as string;
}

// A wrong code of the right format: never the real one.
const wrongCodeFor = (code: string) => (code === "000000" ? "111111" : "000000");

// Next.js adds its own role="alert" (the route announcer), so the page's message is found by its tag.
const alert = (page: Page) => page.locator("p[role=alert]");
const confirm = (page: Page) => page.getByRole("button", { name: "Confirm" });

test("shows the title, the instruction, six boxes, CONFIRM, RESEND and LATER", async ({
  page,
  context,
}) => {
  await openAsUnverifiedUser(page, context);

  await expect(page.getByRole("heading", { name: "Email verification" })).toBeVisible();
  await expect(page.getByText("Enter the verification code we sent to your email.")).toBeVisible();
  await expect(page.getByRole("textbox")).toHaveCount(6);
  await expect(confirm(page)).toBeVisible();
  await expect(page.getByRole("button", { name: "Resend code" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Later" })).toBeVisible();
});

test("moves the focus to the next box while typing", async ({ page, context }) => {
  await openAsUnverifiedUser(page, context);

  await enterCode(page, "12");

  await expect(page.getByRole("textbox", { name: "Digit 1 of 6" })).toHaveValue("1");
  await expect(page.getByRole("textbox", { name: "Digit 2 of 6" })).toHaveValue("2");
  await expect(page.getByRole("textbox", { name: "Digit 3 of 6" })).toBeFocused();
});

test("shows validation messages and sends nothing for an empty or incomplete code", async ({
  page,
  context,
}) => {
  await openAsUnverifiedUser(page, context);

  await confirm(page).click();
  await expect(alert(page)).toHaveText("Verification code is required");

  await enterCode(page, "123");
  await expect(alert(page)).toHaveText("Please enter a valid 6-digit code");
  await expect(page).toHaveURL(/\/verify-email$/);
});

test("a wrong code shows an error and keeps the digits", async ({ page, context }) => {
  const email = await openAsUnverifiedUser(page, context);
  const wrong = wrongCodeFor(await readCode(email));

  await enterCode(page, wrong);
  await confirm(page).click();

  await expect(alert(page)).toHaveText("Invalid verification code");
  await expect(page.getByRole("textbox", { name: "Digit 1 of 6" })).toHaveValue(wrong[0]!);
  await expect(page.getByRole("textbox", { name: "Digit 6 of 6" })).toHaveValue(wrong[5]!);
  await expect(page).toHaveURL(/\/verify-email$/);
});

test("the code from the mail verifies the account, and it cannot be used again", async ({
  page,
  context,
}) => {
  const email = await openAsUnverifiedUser(page, context);
  const code = await readCode(email);

  await enterCode(page, code);
  await confirm(page).click();

  await expect(page).toHaveURL(/\/users$/);

  // A verified user has nothing to do on the page: it sends them back.
  await page.goto("/verify-email");
  await expect(page).toHaveURL(/\/users$/);

  // The account is verified now, so the backend refuses the same code again.
  const response = await page.request.post("/graphql", {
    data: {
      query: "mutation Verify($input: VerifyEmailInput!) { verifyEmail(input: $input) { id } }",
      variables: { input: { code } },
    },
  });
  const body = (await response.json()) as { errors?: { extensions?: { reason?: string } }[] };
  expect(body.errors?.[0]?.extensions?.reason).toBe("ALREADY_VERIFIED");
});

test("LATER leads to the application without verifying", async ({ page, context }) => {
  await openAsUnverifiedUser(page, context);

  await page.getByRole("link", { name: "Later" }).click();

  await expect(page).toHaveURL(/\/users$/);
  // Not verified: the page is still open to this user.
  await page.goto("/verify-email");
  await expect(page.getByRole("heading", { name: "Email verification" })).toBeVisible();
});

test("RESEND right after sign-up asks the user to wait and shows the countdown", async ({
  page,
  context,
}) => {
  await openAsUnverifiedUser(page, context);

  await page.getByRole("button", { name: "Resend code" }).click();

  await expect(alert(page)).toHaveText("Please wait before requesting another code");
  await expect(page.getByRole("button", { name: /^Resend code in \d+ s$/ })).toBeDisabled();
});

test("a visitor who is not signed in is sent to the sign-in page", async ({ page }) => {
  await page.goto("/verify-email");

  await expect(page).toHaveURL(/\/sign-in$/);
});

test("shows the page in Polish and keeps the language on LATER", async ({ page, context }) => {
  await signUp(context);

  await page.goto("/pl/verify-email");
  await expect(page.getByRole("heading", { name: "Weryfikacja e-maila" })).toBeVisible();
  await page.getByRole("button", { name: "Potwierdź" }).click();
  await expect(alert(page)).toHaveText("Kod weryfikacyjny jest wymagany");

  await page.getByRole("link", { name: "Później" }).click();
  await expect(page).toHaveURL(/\/pl\/users$/);
});
