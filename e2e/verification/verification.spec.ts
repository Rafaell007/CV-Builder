import { expect, test, type Cookie, type Page } from "@playwright/test";
import { findMails } from "../support/mailpit";
import { signUp } from "../support/signUp";

// The code field is one input until the shared OtpField (S1.1b) replaces it; change this helper then.
const codeField = (page: Page) => page.getByLabel("Verification code");
const confirm = (page: Page) => page.getByRole("button", { name: "CONFIRM" });

/** The 6-digit code from the newest mail sent to `email`. */
async function readCode(email: string): Promise<string> {
  await expect
    .poll(async () => (await findMails(email))[0]?.Text ?? "", { timeout: 10_000 })
    .toMatch(/\b\d{6}\b/);
  const [mail] = await findMails(email);
  return /\b(\d{6})\b/.exec(mail?.Text ?? "")?.[1] ?? "";
}

// A wrong code of the right format: never the real one.
const wrongCodeFor = (code: string) => (code === "000000" ? "111111" : "000000");

// The backend allows 10 sign-ups a minute from one address (D23), so the specs share two accounts
// instead of creating one per test: one for the checks that leave the account unverified, and one
// that is verified by its test.
test.describe("an unverified user", () => {
  // Serial: one worker runs the whole group, so the account is created once.
  test.describe.configure({ mode: "serial" });

  let email: string;
  let cookies: Cookie[];

  test.beforeAll(async ({ browser, baseURL }) => {
    const context = await browser.newContext(baseURL ? { baseURL } : {});
    email = await signUp(context);
    cookies = await context.cookies();
    await context.close();
  });

  test.beforeEach(async ({ page, context }) => {
    await context.addCookies(cookies);
    await page.goto("/verify-email");
  });

  test("sees the title, the instruction and the actions", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Email verification" })).toBeVisible();
    await expect(
      page.getByText("Enter the verification code we sent to your email."),
    ).toBeVisible();
    await expect(confirm(page)).toBeVisible();
    await expect(page.getByRole("link", { name: "LATER" })).toBeVisible();
  });

  test("is asked for a code and for 6 digits before anything is sent", async ({ page }) => {
    await confirm(page).click();
    await expect(page.getByText("Verification code is required")).toBeVisible();

    await codeField(page).fill("123");
    await confirm(page).click();
    await expect(page.getByText("Please enter a valid 6-digit code")).toBeVisible();
    await expect(page).toHaveURL(/\/verify-email$/);
  });

  test("keeps only digits when a code is entered with other characters", async ({ page }) => {
    await codeField(page).fill("12 34-56");

    await expect(codeField(page)).toHaveValue("123456");
  });

  test("sees an error for a wrong code and keeps the typed code", async ({ page }) => {
    const wrong = wrongCodeFor(await readCode(email));
    await codeField(page).fill(wrong);

    await confirm(page).click();

    await expect(page.getByText("Invalid verification code")).toBeVisible();
    await expect(codeField(page)).toHaveValue(wrong);
    await expect(page).toHaveURL(/\/verify-email$/);
  });

  test("cannot request a new code right after the first one", async ({ page }) => {
    await page.getByRole("button", { name: "RESEND CODE" }).click();

    await expect(page.getByText("Please wait before requesting another code")).toBeVisible();
    await expect(page.getByRole("button", { name: /^RESEND CODE \(\d+s\)$/ })).toBeDisabled();
  });

  test("opens the app with LATER and stays unverified", async ({ page }) => {
    await page.getByRole("link", { name: "LATER" }).click();
    await expect(page).toHaveURL(/\/users$/);

    // Not verified: the verification page is still open to this user.
    await page.goto("/verify-email");
    await expect(page).toHaveURL(/\/verify-email$/);
  });
});

test("the code from the mail verifies the account, and it cannot be used again", async ({
  page,
  context,
}) => {
  const email = await signUp(context);
  await page.goto("/verify-email");
  const code = await readCode(email);
  await codeField(page).fill(code);

  await confirm(page).click();

  await expect(page).toHaveURL(/\/users$/);

  // A verified user is sent away from the verification page.
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
