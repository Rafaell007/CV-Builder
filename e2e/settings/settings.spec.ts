import { expect, test, type Page } from "@playwright/test";
import { canSignIn } from "../support/account";
import { signUp } from "../support/signUp";

// Every test signs up its own account: changing a seeded user's password would break the specs that run
// in parallel and sign in with it. An unverified account may use the page (KAN-94 decision C).
const OLD_PASSWORD = "Password123!"; // the password support/signUp.ts uses
const NEW_PASSWORD = "NewPassword456!";

const themeSelect = (page: Page) => page.getByRole("combobox", { name: "Theme" });
const submit = (page: Page) => page.getByRole("button", { name: "Change" });

async function fillPasswords(page: Page, current: string, next = NEW_PASSWORD) {
  await page.getByLabel("Password", { exact: true }).fill(current);
  await page.getByLabel("New Password").fill(next);
  await page.getByLabel("Confirm Password").fill(next);
}

let email: string;

test.beforeEach(async ({ context, page }) => {
  email = await signUp(context);
  await page.goto("/settings");
});

test("shows the selects with the current values and an empty password form", async ({ page }) => {
  await expect(page.getByRole("navigation", { name: "Breadcrumbs" })).toContainText("Settings");
  await expect(themeSelect(page)).toHaveText("Device settings");
  await expect(page.getByRole("combobox", { name: "Language" })).toHaveText("English");
  await expect(page.getByRole("heading", { name: "Change password" })).toBeVisible();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("type", "password");
  await expect(submit(page)).toBeDisabled();
});

test("the chosen theme is applied and stays after a reload", async ({ page }) => {
  await themeSelect(page).click();
  await page.getByRole("option", { name: "Dark" }).click();

  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(themeSelect(page)).toHaveText("Dark");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(themeSelect(page)).toHaveText("Dark");
});

test("the chosen language opens the page in that language", async ({ page }) => {
  await page.getByRole("combobox", { name: "Language" }).click();
  await page.getByRole("option", { name: "Polski" }).click();

  await expect(page).toHaveURL(/\/pl\/settings$/);
  await expect(page.getByRole("combobox", { name: "Motyw" })).toHaveText("Ustawienia urządzenia");
  await expect(page.getByRole("heading", { name: "Zmiana hasła" })).toBeVisible();
});

test("changes the password: the new one signs in, the old one no longer does", async ({
  page,
  request,
}) => {
  await fillPasswords(page, OLD_PASSWORD);
  await submit(page).click();

  await expect(page.getByText("Password changed")).toBeVisible();
  await expect(page.getByLabel("New Password")).toHaveValue("");
  // The current session got new tokens, so the page keeps working after a reload.
  await page.reload();
  await expect(themeSelect(page)).toBeVisible();

  expect(await canSignIn(request, email, NEW_PASSWORD)).toBe(true);
  expect(await canSignIn(request, email, OLD_PASSWORD)).toBe(false);
});

test("a wrong current password is explained and the password stays the same", async ({
  page,
  request,
}) => {
  await fillPasswords(page, "WrongPassword1");
  await submit(page).click();

  await expect(page.getByText("Current password is incorrect")).toBeVisible();
  await expect(page.getByLabel("New Password")).toHaveValue(NEW_PASSWORD);
  expect(await canSignIn(request, email, OLD_PASSWORD)).toBe(true);
});
