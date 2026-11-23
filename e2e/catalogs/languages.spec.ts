import { expect, test, type Page } from "@playwright/test";
import { createLanguage, deleteLanguagesByName } from "../support/languages";
import { ADMIN_EMAIL, signIn, USER_EMAIL } from "../support/signIn";

// The Languages page is the shared CatalogPage (support/catalogPage.ts tests it with Departments and Positions) with
// two more columns, an ISO sort and a three-field form, so it has its own spec. The seed
// (backend/prisma/seed/catalogs.data.ts) has 12 languages, more than one page. The tests of this file run one after
// another: the tests that add languages remove them in `afterEach`, so the list checks never see them.
// Not here: the "in use" delete. No API gives a user a language yet, so this file cannot make a language in use
// without touching seed data; Languages.test.tsx and the backend tests cover it (catalogs README).

const PAGE_SIZE = 10;
// Every language these tests make has this text in its name, so `afterEach` can remove all of them. Their ISO codes
// start with "Q", which no seed language uses.
const PREFIX = "E2E Language";

const search = (page: Page) => page.getByRole("searchbox", { name: "Search languages" });
const columnHeader = (page: Page, name: string) =>
  page.getByRole("columnheader", { name, exact: true });
const pagination = (page: Page) => page.getByRole("navigation", { name: "Languages pagination" });
const dataRows = (page: Page) => page.locator("tbody tr").filter({ has: page.getByRole("cell") });
const row = (page: Page, name: string) => dataRows(page).filter({ hasText: name });
const dialog = (page: Page) => page.getByRole("dialog");
const confirmDialog = (page: Page) => page.getByRole("alertdialog");
const field = (page: Page, name: "Name" | "ISO" | "Native name") =>
  dialog(page).getByRole("textbox", { name, exact: true });

/** Checks the Name, ISO and Native name cells of the one row with this name (the row menu cell is left out). */
async function expectRow(page: Page, name: string, iso: string, nativeName: string) {
  const cells = row(page, name).getByRole("cell");
  await expect(cells.nth(0)).toHaveText(name);
  await expect(cells.nth(1)).toHaveText(iso);
  await expect(cells.nth(2)).toHaveText(nativeName);
}

async function find(page: Page, text: string) {
  await search(page).fill(text);
  await search(page).press("Enter");
}

async function openRowMenu(page: Page, name: string, action: "Edit" | "Delete") {
  await page.getByRole("button", { name: `Actions for ${name}` }).click();
  await page.getByRole("menuitem", { name: action }).click();
}

async function openCreate(page: Page) {
  await page.getByRole("button", { name: "CREATE LANGUAGE" }).click();
  await expect(dialog(page).getByRole("button", { name: "Create" })).toBeDisabled();
}

async function fillForm(page: Page, name: string, iso: string, nativeName: string) {
  await field(page, "Name").fill(name);
  await field(page, "ISO").fill(iso);
  await field(page, "Native name").fill(nativeName);
}

async function open(page: Page) {
  await page.goto("/en/admin/languages");
  await expect(page.getByRole("heading", { name: "Languages" })).toBeVisible();
}

test.describe("language list, as an admin", () => {
  test.beforeEach(async ({ context, page }) => {
    await signIn(context, ADMIN_EMAIL);
    await open(page);
  });

  test("shows 10 languages sorted by name ascending, with pages", async ({ page }) => {
    await expect(dataRows(page)).toHaveCount(PAGE_SIZE);
    await expect(columnHeader(page, "Name")).toHaveAttribute("aria-sort", "ascending");
    await expect(columnHeader(page, "ISO")).toBeVisible();
    await expect(columnHeader(page, "Native name")).toBeVisible();
    await expect(pagination(page)).toBeVisible();
  });

  test("a click on ISO sorts by the ISO code on the backend", async ({ page }) => {
    // By name the first row is Chinese (ZH); by ISO it is Czech (CS).
    const firstName = dataRows(page).first().getByRole("cell").first();
    await expect(firstName).toHaveText("Chinese");

    await page.getByRole("button", { name: "ISO" }).click();

    await expect(columnHeader(page, "ISO")).toHaveAttribute("aria-sort", "ascending");
    await expect(firstName).toHaveText("Czech");
  });

  test("searches without regard to letter case and shows the ISO code and native name", async ({
    page,
  }) => {
    await find(page, "GERM");

    await expect(dataRows(page)).toHaveCount(1);
    await expectRow(page, "German", "DE", "Deutsch");
  });

  test("shows No languages found and keeps the text when nothing matches", async ({ page }) => {
    await find(page, "zzzz");

    await expect(page.getByText("No languages found")).toBeVisible();
    await expect(search(page)).toHaveValue("zzzz");
  });

  test("shows the page in Polish", async ({ page }) => {
    await page.goto("/pl/admin/languages");

    await expect(page.getByRole("heading", { name: "Języki" })).toBeVisible();
    await expect(columnHeader(page, "Nazwa rodzima")).toBeVisible();
    await expect(dataRows(page)).toHaveCount(PAGE_SIZE);
  });
});

test.describe("language list, as a user", () => {
  test("a user without the Admin role does not get the list", async ({ context, page }) => {
    await signIn(context, USER_EMAIL);

    await page.goto("/en/admin/languages");

    await expect(page).toHaveURL(/\/users$/);
  });
});

test.describe("languages, create, update and delete", () => {
  test.beforeEach(async ({ context, page }) => {
    await signIn(context, ADMIN_EMAIL);
    await open(page);
  });

  test.afterEach(async ({ context }) => {
    await deleteLanguagesByName(context, PREFIX);
  });

  test("creates a language: the ISO code turns uppercase, the modal closes and a toast shows", async ({
    page,
  }) => {
    const name = `${PREFIX} Created`;

    await openCreate(page);
    await fillForm(page, name, "qa-b", "Created");
    // Uppercase by CSS while typing; the backend gets and stores "QA-B" (the row below).
    await expect(field(page, "ISO")).toHaveCSS("text-transform", "uppercase");
    await dialog(page).getByRole("button", { name: "Create" }).click();

    await expect(dialog(page)).toBeHidden();
    await expect(page.getByText("Language created", { exact: true })).toBeVisible();
    await find(page, name);
    await expectRow(page, name, "QA-B", "Created");
  });

  test("refuses a name that exists in another letter case and keeps the typed values", async ({
    page,
  }) => {
    await openCreate(page);
    await fillForm(page, "ENGLISH", "QB", "English");
    await dialog(page).getByRole("button", { name: "Create" }).click();

    await expect(dialog(page).getByText("Language already exists")).toBeVisible();
    await expect(field(page, "Name")).toHaveValue("ENGLISH");
    await expect(field(page, "ISO")).toHaveValue("QB");
  });

  test("refuses an ISO code that exists and shows it under the ISO field", async ({ page }) => {
    await openCreate(page);
    await fillForm(page, `${PREFIX} Taken ISO`, "en", "Taken");
    await dialog(page).getByRole("button", { name: "Create" }).click();

    await expect(dialog(page).getByText("ISO code already exists")).toBeVisible();
    await expect(dialog(page).getByText("Language already exists")).toBeHidden();
  });

  test("shows the messages of an empty name and an invalid ISO code", async ({ page }) => {
    await openCreate(page);
    await field(page, "Name").fill("   ");
    await field(page, "Name").press("Tab");
    await field(page, "ISO").fill("e1");
    await field(page, "ISO").press("Tab");

    await expect(dialog(page).getByText("Name is required")).toBeVisible();
    await expect(
      dialog(page).getByText("ISO may contain only the letters A-Z and one hyphen"),
    ).toBeVisible();
    await expect(dialog(page).getByRole("button", { name: "Create" })).toBeDisabled();
  });

  test("updates a language: the form is filled, the new values show in the list", async ({
    context,
    page,
  }) => {
    const name = `${PREFIX} Updated`;
    await createLanguage(context, { name, iso: "QC", nativeName: "Before" });
    await find(page, name);

    await openRowMenu(page, name, "Edit");
    await expect(field(page, "Name")).toHaveValue(name);
    await expect(field(page, "ISO")).toHaveValue("QC");
    await expect(field(page, "Native name")).toHaveValue("Before");
    await expect(dialog(page).getByRole("button", { name: "Update" })).toBeDisabled();
    await field(page, "ISO").fill("qd");
    await field(page, "Native name").fill("After");
    await dialog(page).getByRole("button", { name: "Update" }).click();

    await expect(dialog(page)).toBeHidden();
    await expect(page.getByText("Language updated", { exact: true })).toBeVisible();
    await expectRow(page, name, "QD", "After");
  });

  test("deletes a language that nothing uses", async ({ context, page }) => {
    const name = `${PREFIX} Delete me`;
    await createLanguage(context, { name, iso: "QE", nativeName: "Delete me" });
    await find(page, name);

    await openRowMenu(page, name, "Delete");
    await expect(confirmDialog(page)).toContainText(
      `Are you sure you want to delete language ${name}?`,
    );
    await confirmDialog(page).getByRole("button", { name: "Confirm" }).click();

    await expect(confirmDialog(page)).toBeHidden();
    await expect(page.getByText("No languages found")).toBeVisible();
  });
});
