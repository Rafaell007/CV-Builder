import { expect, test, type Page } from "@playwright/test";
import { ADMIN_EMAIL, PASSWORD, signIn, USER_EMAIL } from "../support/signIn";
import { createUser, deleteUsersByName, testUserEmail, type TestUser } from "../support/users";

// The Employees page (/users). The seed has 4 users (backend/prisma/seed/users.data.ts), but the sign-up and settings
// specs add users without names while this file runs, and PostgreSQL sorts empty names first in descending order. So
// the tests that count rows or check the order use their own users and search for them first.

const PAGE_SIZE = 10;
// The last name of every user these tests make (also through the page), and part of their email, so a search finds
// only them and `afterEach` can remove all of them. One word: the search matches word by word.
const PREFIX = "E2EUsers";
const PROFILE_URL = /\/users\/[^/]+\/profile$/;

const search = (page: Page) => page.getByRole("searchbox", { name: "Search employees" });
const table = (page: Page) => page.getByRole("table", { name: "Employees list" });
const header = (page: Page, name: string) => page.getByRole("columnheader", { name });
const pagination = (page: Page) => page.getByRole("navigation", { name: "Employees pagination" });
const dataRows = (page: Page) => page.locator("tbody tr").filter({ has: page.getByRole("cell") });
const row = (page: Page, text: string) => dataRows(page).filter({ hasText: text });
const dialog = (page: Page) => page.getByRole("dialog");
// The delete modal is a ConfirmModal, which Radix marks as an alertdialog.
const confirmDialog = (page: Page) => page.getByRole("alertdialog");
const createButton = (page: Page) => page.getByRole("button", { name: "CREATE USER" });

const testUser = (firstName: string, extra: Partial<TestUser> = {}): TestUser => ({
  firstName,
  lastName: PREFIX,
  ...extra,
});

async function open(page: Page, locale: "en" | "pl" = "en") {
  await page.goto(`/${locale}/users`);
  await expect(
    page.getByRole("heading", { name: locale === "en" ? "Employees" : "Pracownicy" }),
  ).toBeVisible();
}

async function find(page: Page, text: string) {
  await search(page).fill(text);
  await search(page).press("Enter");
}

async function openRowMenu(page: Page, name: string, action: "View" | "Update" | "Delete") {
  await page.getByRole("button", { name: `Actions for ${name}` }).click();
  await page.getByRole("menuitem", { name: action }).click();
}

// The options load when the modal opens: the field is disabled until then.
async function choose(page: Page, field: "Department" | "Position" | "Role", option: string) {
  const select = dialog(page).getByRole("combobox", { name: field });
  await expect(select).toBeEnabled();
  await select.click();
  await page.getByRole("option", { name: option, exact: true }).click();
}

async function fillCreateForm(page: Page, user: { email: string; firstName: string }) {
  await dialog(page).getByRole("textbox", { name: "Email" }).fill(user.email);
  await dialog(page).getByLabel("Password", { exact: true }).fill(PASSWORD);
  await dialog(page).getByRole("textbox", { name: "First Name" }).fill(user.firstName);
  await dialog(page).getByRole("textbox", { name: "Last Name" }).fill(PREFIX);
  await choose(page, "Department", "Engineering");
  await choose(page, "Position", "Frontend Developer");
}

test.describe("users page, as an admin, with the seed data", () => {
  test.beforeEach(async ({ context, page }) => {
    await signIn(context, ADMIN_EMAIL);
    await open(page);
  });

  test("starts sorted by first name, A to Z, with the seeded admin on page 1", async ({ page }) => {
    await expect(header(page, "First Name")).toHaveAttribute("aria-sort", "ascending");
    await expect(dataRows(page).first()).toContainText("Ada");
    await expect(dataRows(page).first()).toContainText("admin@example.com");
    await expect(dataRows(page).first()).toContainText("Product");
    await expect(dataRows(page).first()).toContainText("Project Manager");
    await expect(createButton(page)).toBeVisible();
  });

  test("searches the last name and the email, without regard to case", async ({ page }) => {
    await find(page, "KOWALSKI");
    await expect(dataRows(page)).toHaveCount(1);
    await expect(dataRows(page).first()).toContainText("Jan");

    await find(page, "user2@example");
    await expect(dataRows(page)).toHaveCount(1);
    await expect(dataRows(page).first()).toContainText("Anna");
  });

  test("shows No employees found and keeps the typed text when nothing matches", async ({
    page,
  }) => {
    await find(page, "zzzz");

    await expect(page.getByText("No employees found")).toBeVisible();
    await expect(search(page)).toHaveValue("zzzz");
  });

  test("a click on a row and View in the row menu open the profile", async ({ page }) => {
    await find(page, "Kowalski");
    await row(page, "Kowalski").getByRole("cell", { name: "Jan", exact: true }).click();
    await expect(page).toHaveURL(PROFILE_URL);

    await open(page);
    await find(page, "Kowalski");
    await openRowMenu(page, "Jan Kowalski", "View");
    await expect(page).toHaveURL(PROFILE_URL);
  });

  test("on the admin's own row, Delete is disabled and Update locks the role", async ({ page }) => {
    await find(page, "admin@example.com");

    await page.getByRole("button", { name: "Actions for Ada Admin" }).click();
    await expect(page.getByRole("menuitem", { name: "Delete" })).toBeDisabled();
    await page.getByRole("menuitem", { name: "Update" }).click();

    await expect(dialog(page).getByRole("textbox", { name: "Email" })).toHaveValue(
      "admin@example.com",
    );
    await expect(dialog(page).getByRole("textbox", { name: "Email" })).toBeDisabled();
    await expect(dialog(page).getByLabel("Password", { exact: true })).toBeDisabled();
    await expect(dialog(page).getByRole("combobox", { name: "Role" })).toBeDisabled();
    await expect(dialog(page).getByText("You cannot change your own role")).toBeVisible();
    await expect(dialog(page).getByRole("button", { name: "Update" })).toBeDisabled();
  });

  test("hides Email and Position on a tablet", async ({ page }) => {
    await expect(header(page, "Email")).toBeVisible();

    await page.setViewportSize({ width: 800, height: 900 });

    await expect(header(page, "Email")).toBeHidden();
    await expect(header(page, "Position")).toBeHidden();
    await expect(header(page, "Department")).toBeVisible();
  });

  test("shows the page in Polish", async ({ page }) => {
    await open(page, "pl");

    await expect(page.getByRole("table", { name: "Lista pracowników" })).toBeVisible();
    await expect(page.getByRole("button", { name: "UTWÓRZ UŻYTKOWNIKA" })).toBeVisible();
  });
});

test.describe("users page, as an employee", () => {
  test.beforeEach(async ({ context, page }) => {
    await signIn(context, USER_EMAIL);
    await open(page);
  });

  test("sees the list without CREATE USER and without row menus", async ({ page }) => {
    await expect(table(page).getByRole("cell", { name: "Ada", exact: true })).toBeVisible();

    await expect(createButton(page)).toBeHidden();
    await expect(page.getByRole("button", { name: /^Actions for / })).toHaveCount(0);
  });

  test("the arrow of a row opens the profile", async ({ page }) => {
    await find(page, "Kowalski");

    await page.getByRole("link", { name: "Open profile of Jan Kowalski" }).click();

    await expect(page).toHaveURL(PROFILE_URL);
  });
});

test.describe("users page, sort and pages, with own users", () => {
  test.beforeEach(async ({ context }) => {
    await signIn(context, ADMIN_EMAIL);
  });

  test.afterEach(async ({ context }) => {
    await deleteUsersByName(context, PREFIX);
  });

  test("sorts by first name both ways and by department", async ({ context, page }) => {
    await createUser(context, testUser("Alpha", { department: "Quality Assurance" }));
    await createUser(context, testUser("Bravo", { department: "Engineering" }));
    await createUser(context, testUser("Charlie", { department: "Product" }));
    await open(page);
    await find(page, PREFIX);
    await expect(dataRows(page)).toContainText(["Alpha", "Bravo", "Charlie"]);

    await page.getByRole("button", { name: "First Name" }).click();
    await expect(header(page, "First Name")).toHaveAttribute("aria-sort", "descending");
    await expect(dataRows(page)).toContainText(["Charlie", "Bravo", "Alpha"]);

    await page.getByRole("button", { name: "Department" }).click();
    await expect(header(page, "Department")).toHaveAttribute("aria-sort", "ascending");
    await expect(dataRows(page)).toContainText(["Engineering", "Product", "Quality Assurance"]);
  });

  test("shows 10 users on page 1 and the rest on page 2", async ({ context, page }) => {
    for (let number = 1; number <= PAGE_SIZE + 1; number += 1) {
      await createUser(context, testUser(`Paging${String(number).padStart(2, "0")}`));
    }
    await open(page);
    await find(page, PREFIX);
    await expect(dataRows(page)).toHaveCount(PAGE_SIZE);

    await pagination(page).getByRole("button", { name: "Page 2" }).click();

    await expect(pagination(page).getByRole("button", { name: "Page 2" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(dataRows(page)).toHaveCount(1);
    await expect(dataRows(page).first()).toContainText("Paging11");
  });
});

test.describe("users page, create, update and delete", () => {
  test.beforeEach(async ({ context, page }) => {
    await signIn(context, ADMIN_EMAIL);
    await open(page);
  });

  test.afterEach(async ({ context }) => {
    await deleteUsersByName(context, PREFIX);
  });

  test("creates a user: the modal closes, a toast shows and the row is in the list", async ({
    page,
  }) => {
    const user = { firstName: "Created", email: testUserEmail(testUser("Created")) };

    await createButton(page).click();
    await expect(dialog(page).getByRole("combobox", { name: "Role" })).toHaveText("Employee");
    await expect(dialog(page).getByRole("button", { name: "Create" })).toBeDisabled();
    await fillCreateForm(page, user);
    await dialog(page).getByRole("button", { name: "Create" }).click();

    await expect(dialog(page)).toBeHidden();
    await expect(page.getByText("User created", { exact: true })).toBeVisible();
    await find(page, PREFIX);
    await expect(row(page, user.email)).toHaveCount(1);
    await expect(row(page, user.email)).toContainText("Engineering");
  });

  test("shows the taken email under the field and keeps the modal open", async ({ page }) => {
    await createButton(page).click();
    await fillCreateForm(page, { firstName: "Taken", email: ADMIN_EMAIL });
    await dialog(page).getByRole("button", { name: "Create" }).click();

    await expect(dialog(page).getByText("A user with this email already exists")).toBeVisible();
    await expect(dialog(page)).toBeVisible();
  });

  test("updates a user: the form is filled and the new data shows in the list", async ({
    context,
    page,
  }) => {
    await createUser(context, testUser("Before"));
    await find(page, PREFIX);

    await openRowMenu(page, `Before ${PREFIX}`, "Update");
    const firstName = dialog(page).getByRole("textbox", { name: "First Name" });
    await expect(firstName).toHaveValue("Before");
    await expect(dialog(page).getByRole("textbox", { name: "Email" })).toBeDisabled();
    await expect(dialog(page).getByRole("button", { name: "Update" })).toBeDisabled();
    // The click ends the selection guard of the modal (see `useFirstFieldFocus`), as in the projects spec: without
    // it, `fill` can add the new text to the old one.
    await firstName.click();
    await firstName.fill("After");
    await choose(page, "Department", "Product");
    await dialog(page).getByRole("button", { name: "Update" }).click();

    await expect(dialog(page)).toBeHidden();
    await expect(page.getByText("User updated", { exact: true })).toBeVisible();
    await expect(row(page, "After")).toHaveCount(1);
    await expect(row(page, "After")).toContainText("Product");
  });

  test("Cancel in the delete modal keeps the user, Confirm removes it", async ({
    context,
    page,
  }) => {
    await createUser(context, testUser("Delete"));
    await find(page, PREFIX);

    await openRowMenu(page, `Delete ${PREFIX}`, "Delete");
    await expect(confirmDialog(page)).toContainText(
      `Are you sure you want to delete user Delete ${PREFIX}?`,
    );
    await confirmDialog(page).getByRole("button", { name: "Cancel" }).click();
    await expect(confirmDialog(page)).toBeHidden();
    await expect(dataRows(page)).toHaveCount(1);

    await openRowMenu(page, `Delete ${PREFIX}`, "Delete");
    await confirmDialog(page).getByRole("button", { name: "Confirm" }).click();

    await expect(confirmDialog(page)).toBeHidden();
    await expect(page.getByText("User deleted", { exact: true })).toBeVisible();
    await expect(page.getByText("No employees found")).toBeVisible();
  });
});
