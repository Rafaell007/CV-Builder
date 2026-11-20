import { expect, test, type Page } from "@playwright/test";
import { ADMIN_EMAIL, signIn, USER_EMAIL } from "../support/signIn";
import { createSkill, deleteSkillsByName } from "../support/skills";

// The Skills page is the shared CatalogPage (support/catalogPage.ts tests it with Departments and Positions) with two
// more columns and a Category field, so it has its own spec. The seed (backend/prisma/seed/catalogs.data.ts) has 41
// skills, more than one page. The tests of this file run one after another: the tests that add skills remove them in
// `afterEach`, so the list checks never see them.

const PAGE_SIZE = 10;
// Every skill these tests make has this text in its name, so `afterEach` can remove all of them.
const PREFIX = "E2E Skill";

const search = (page: Page) => page.getByRole("searchbox", { name: "Search skills" });
const header = (page: Page) => page.getByRole("columnheader", { name: "Name" });
const pagination = (page: Page) => page.getByRole("navigation", { name: "Skills pagination" });
const dataRows = (page: Page) => page.locator("tbody tr").filter({ has: page.getByRole("cell") });
const row = (page: Page, name: string) => dataRows(page).filter({ hasText: name });
const dialog = (page: Page) => page.getByRole("dialog");
const confirmDialog = (page: Page) => page.getByRole("alertdialog");
const nameField = (page: Page) => dialog(page).getByRole("textbox", { name: "Name" });
const categoryField = (page: Page) => dialog(page).getByRole("combobox", { name: "Category" });

/** Checks the Name, Type and Category cells of the one row with this name (the row menu cell is left out). */
async function expectRow(page: Page, name: string, type: string, category: string) {
  const cells = row(page, name).getByRole("cell");
  await expect(cells.nth(0)).toHaveText(name);
  await expect(cells.nth(1)).toHaveText(type);
  await expect(cells.nth(2)).toHaveText(category);
}

async function find(page: Page, text: string) {
  await search(page).fill(text);
  await search(page).press("Enter");
}

async function openRowMenu(page: Page, name: string, action: "Edit" | "Delete") {
  await page.getByRole("button", { name: `Actions for ${name}` }).click();
  await page.getByRole("menuitem", { name: action }).click();
}

async function chooseCategory(page: Page, name: string) {
  await expect(categoryField(page)).toBeEnabled();
  await categoryField(page).click();
  await page.getByRole("option", { name }).click();
}

async function open(page: Page) {
  await page.goto("/en/admin/skills");
  await expect(page.getByRole("heading", { name: "Skills" })).toBeVisible();
}

test.describe("skill list, as an admin", () => {
  test.beforeEach(async ({ context, page }) => {
    await signIn(context, ADMIN_EMAIL);
    await open(page);
  });

  test("shows 10 skills sorted by name ascending, with pages", async ({ page }) => {
    await expect(dataRows(page)).toHaveCount(PAGE_SIZE);
    await expect(header(page)).toHaveAttribute("aria-sort", "ascending");
    await expect(page.getByRole("columnheader", { name: "Type" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Category" })).toBeVisible();
    await expect(pagination(page)).toBeVisible();
  });

  test("a click on Name sorts descending on the backend", async ({ page }) => {
    const first = await dataRows(page).first().getByRole("cell").first().textContent();

    await page.getByRole("button", { name: "Name" }).click();

    await expect(header(page)).toHaveAttribute("aria-sort", "descending");
    await expect(dataRows(page).first()).not.toContainText(first!);
  });

  test("searches without regard to letter case and shows the type and category", async ({
    page,
  }) => {
    await find(page, "REACT");

    await expect(dataRows(page)).toHaveCount(1);
    await expectRow(page, "React", "Technology", "Frontend");
  });

  test("shows No skills found and keeps the text when nothing matches", async ({ page }) => {
    await find(page, "zzzz");

    await expect(page.getByText("No skills found")).toBeVisible();
    await expect(search(page)).toHaveValue("zzzz");
  });

  test("shows the page in Polish", async ({ page }) => {
    await page.goto("/pl/admin/skills");

    await expect(page.getByRole("heading", { name: "Umiejętności" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Kategoria" })).toBeVisible();
    await expect(dataRows(page)).toHaveCount(PAGE_SIZE);
  });
});

test.describe("skill list, as a user", () => {
  test("a user without the Admin role does not get the list", async ({ context, page }) => {
    await signIn(context, USER_EMAIL);

    await page.goto("/en/admin/skills");

    await expect(page).toHaveURL(/\/users$/);
  });
});

test.describe("skills, create, update and delete", () => {
  test.beforeEach(async ({ context, page }) => {
    await signIn(context, ADMIN_EMAIL);
    await open(page);
  });

  test.afterEach(async ({ context }) => {
    await deleteSkillsByName(context, PREFIX);
  });

  test("creates a skill: the modal closes, a toast shows and the row has the category's type", async ({
    page,
  }) => {
    const name = `${PREFIX} Created`;

    await page.getByRole("button", { name: "CREATE SKILL" }).click();
    await expect(dialog(page).getByRole("button", { name: "Create" })).toBeDisabled();
    await nameField(page).fill(name);
    await chooseCategory(page, "Testing");
    await dialog(page).getByRole("button", { name: "Create" }).click();

    await expect(dialog(page)).toBeHidden();
    await expect(page.getByText("Skill created", { exact: true })).toBeVisible();
    await find(page, name);
    await expectRow(page, name, "Tool", "Testing");
  });

  test("refuses a name that exists in another letter case and keeps the typed values", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "CREATE SKILL" }).click();
    await nameField(page).fill("REACT");
    await chooseCategory(page, "Frontend");
    await dialog(page).getByRole("button", { name: "Create" }).click();

    await expect(dialog(page).getByText("Skill already exists")).toBeVisible();
    await expect(nameField(page)).toHaveValue("REACT");
    await expect(categoryField(page)).toHaveText("Frontend");
  });

  test("shows the required message for an empty name", async ({ page }) => {
    await page.getByRole("button", { name: "CREATE SKILL" }).click();
    await nameField(page).fill("   ");
    await nameField(page).press("Tab");

    await expect(dialog(page).getByText("Skill is required")).toBeVisible();
    await expect(dialog(page).getByRole("button", { name: "Create" })).toBeDisabled();
  });

  test("moves a skill to another category: the form is filled, the new type shows in the list", async ({
    context,
    page,
  }) => {
    const name = `${PREFIX} Moved`;
    await createSkill(context, name, "Frontend");
    await find(page, name);

    await openRowMenu(page, name, "Edit");
    await expect(nameField(page)).toHaveValue(name);
    await expect(categoryField(page)).toHaveText("Frontend");
    await expect(dialog(page).getByRole("button", { name: "Update" })).toBeDisabled();
    await chooseCategory(page, "Soft Skills");
    await dialog(page).getByRole("button", { name: "Update" }).click();

    await expect(dialog(page)).toBeHidden();
    await expect(page.getByText("Skill updated", { exact: true })).toBeVisible();
    await expectRow(page, name, "Soft skill", "Soft Skills");
  });

  test("deletes a skill that nothing uses", async ({ context, page }) => {
    const name = `${PREFIX} Delete me`;
    await createSkill(context, name, "Testing");
    await find(page, name);

    await openRowMenu(page, name, "Delete");
    await expect(confirmDialog(page)).toContainText(
      `Are you sure you want to delete skill ${name}?`,
    );
    await confirmDialog(page).getByRole("button", { name: "Confirm" }).click();

    await expect(confirmDialog(page)).toBeHidden();
    await expect(page.getByText("No skills found")).toBeVisible();
  });

  test("shows the in-use text inside the modal and keeps the row when a user has the skill", async ({
    page,
  }) => {
    // The seed admin has Leadership (backend/prisma/seed/users.data.ts).
    const inUse = "Leadership";
    await find(page, inUse);
    await openRowMenu(page, inUse, "Delete");
    await confirmDialog(page).getByRole("button", { name: "Confirm" }).click();

    await expect(confirmDialog(page).getByRole("alert")).toHaveText(
      "Skill cannot be deleted because it is currently in use",
    );
    await confirmDialog(page).getByRole("button", { name: "Cancel" }).click();

    await expect(confirmDialog(page)).toBeHidden();
    await expect(row(page, inUse)).toHaveCount(1);
  });
});
