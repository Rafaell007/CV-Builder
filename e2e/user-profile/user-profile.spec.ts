import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { graphql } from "../support/graphql";
import { ADMIN_EMAIL, signIn } from "../support/signIn";
import { signUp } from "../support/signUp";
import { createUser, deleteUsersByName, testUserEmail, type TestUser } from "../support/users";

// The Profile tab of User Details (/users/{id}/profile, KAN-105). The tests make their own employees (seeded ones
// stay unchanged for other specs) with this last name, so `afterEach` can remove them. One word, not part of another
// spec's prefix.
const PREFIX = "E2EProfile";

const alpha: TestUser = { firstName: "Alpha", lastName: PREFIX };
const beta: TestUser = { firstName: "Beta", lastName: PREFIX };

const firstName = (page: Page) => page.getByRole("textbox", { name: /First Name/ });
const department = (page: Page) => page.getByRole("combobox", { name: /Department/ });
const position = (page: Page) => page.getByRole("combobox", { name: /Position/ });
const updateButton = (page: Page) => page.getByRole("button", { name: "Update" });
const profileUrl = (id: string, locale: "en" | "pl" = "en") => `/${locale}/users/${id}/profile`;

async function currentUserId(context: BrowserContext): Promise<string> {
  const data = await graphql<{ me: { id: string } }>(context, "query { me { id } }", {});
  return data.me.id;
}

async function open(page: Page, id: string) {
  await page.goto(profileUrl(id));
  await expect(firstName(page)).toBeVisible();
}

let alphaId: string;
let betaId: string;

test.beforeEach(async ({ context }) => {
  await signIn(context, ADMIN_EMAIL);
  alphaId = await createUser(context, alpha);
  betaId = await createUser(context, beta);
});

test.afterEach(async ({ context }) => {
  await signIn(context, ADMIN_EMAIL);
  await deleteUsersByName(context, PREFIX);
});

test("the server HTML already holds the profile and the form values (PLAN D6)", async ({
  context,
}) => {
  const html = await (await context.request.get(profileUrl(alphaId))).text();

  expect(html).toContain(`Alpha ${PREFIX}`);
  expect(html).toContain("A member since");
  expect(html).toContain('value="Alpha"');
  expect(html).toContain("Engineering");
});

test("an employee edits their own profile, and it stays after a reload", async ({
  context,
  page,
}) => {
  await signIn(context, testUserEmail(alpha));
  await open(page, alphaId);
  await expect(updateButton(page)).toBeDisabled();

  await firstName(page).fill("Alfa");
  await department(page).click();
  await page.getByRole("option", { name: "Design", exact: true }).click();
  await updateButton(page).click();

  await expect(page.getByText("Profile updated", { exact: true })).toBeVisible();
  await expect(updateButton(page)).toBeDisabled();
  // The cached user updates itself: the heading and the breadcrumbs show the new name at once.
  await expect(page.getByRole("heading", { level: 2, name: `Alfa ${PREFIX}` })).toBeVisible();

  await page.reload();
  await expect(firstName(page)).toHaveValue("Alfa");
  await expect(department(page)).toHaveText("Design");
});

test("an employee sees another employee's profile read-only, without UPDATE", async ({
  context,
  page,
}) => {
  await signIn(context, testUserEmail(alpha));
  await open(page, betaId);

  await expect(firstName(page)).toHaveAttribute("readonly", "");
  await expect(position(page)).toHaveAttribute("aria-readonly", "true");
  await expect(updateButton(page)).toBeHidden();
  await expect(page.getByRole("button", { name: "Verify email" })).toBeHidden();

  // Still reachable by keyboard; the list never opens.
  await position(page).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("listbox")).toBeHidden();
});

test("an Admin edits an employee's profile", async ({ page }) => {
  await open(page, betaId);

  await position(page).click();
  await page.getByRole("option", { name: "QA Engineer", exact: true }).click();
  await updateButton(page).click();

  await expect(page.getByText(`Beta ${PREFIX}'s profile was saved.`)).toBeVisible();
  await page.reload();
  await expect(position(page)).toHaveText("QA Engineer");
});

test("a new user opens the Email Verification page with VERIFY EMAIL", async ({
  context,
  page,
}) => {
  // A fresh sign-up is not verified (seeded and created users are). It is not removed: it has no name to search by,
  // like the users of the sign-up and verify-email specs.
  await signUp(context);
  const id = await currentUserId(context);
  await open(page, id);

  await page.getByRole("button", { name: "Verify email" }).click();

  // The sign-up mailed a code less than a minute ago, so the page opens with an info toast (no new code yet).
  await expect(page).toHaveURL(/\/en\/verify-email$/);
  await expect(page.getByText("Check your email", { exact: true })).toBeVisible();
});

test("an unknown employee shows the 404 page", async ({ page }) => {
  await page.goto(profileUrl("00000000-0000-4000-8000-000000000000"));

  await expect(page.getByRole("heading", { level: 1, name: "Hmm..." })).toBeVisible();
});

test("the profile in Polish", async ({ page }) => {
  await page.goto(profileUrl(alphaId, "pl"));

  await expect(page.getByText(/^Członek od /)).toBeVisible();
  await expect(page.getByRole("textbox", { name: /Imię/ })).toHaveValue("Alpha");
  await expect(page.getByRole("button", { name: "Zapisz" })).toBeDisabled();
});
