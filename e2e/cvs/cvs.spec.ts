import { expect, test, type Page } from "@playwright/test";
import { createCvs, deleteCvsByName } from "../support/cvs";
import { waitForHydration } from "../support/hydration";
import { serverRows } from "../support/serverRows";
import { ADMIN_EMAIL, signIn, USER_EMAIL } from "../support/signIn";

// The seed holds 5 CVs (backend/prisma/seed/cvs.data.ts): user1 owns 2, the others 1 each. The page shows 10 rows (PLAN D19).
const SEED_COUNT = 5;
const USER_SEED_COUNT = 2;
const PAGE_SIZE = 10;

const search = (page: Page) => page.getByRole("searchbox", { name: "Search CVs" });
const header = (page: Page, name: string) => page.getByRole("columnheader", { name });
const pagination = (page: Page) => page.getByRole("navigation", { name: "CVs pagination" });
// Rows with data cells: the header row has none. The description under a CV is a row too; the table marks it with
// data-row-detail, so it is left out here.
const dataRows = (page: Page) =>
  page.locator("tbody tr:not([data-row-detail])").filter({ has: page.getByRole("cell") });
// Other spec files run in parallel and create CVs whose names start with "E2E" (they remove them afterwards). The seed
// CVs never have that text, so counts of the seed leave those rows out.
const seedRows = (page: Page) => dataRows(page).filter({ hasNotText: "E2E" });
const row = (page: Page, name: string) => dataRows(page).filter({ hasText: name });
const dialog = (page: Page) => page.getByRole("dialog");
// The delete modal is a ConfirmModal, which Radix marks as an alertdialog.
const confirmDialog = (page: Page) => page.getByRole("alertdialog");

async function find(page: Page, text: string) {
  await search(page).fill(text);
  await search(page).press("Enter");
}

async function openRowMenu(page: Page, name: string, action: "View" | "Edit" | "Delete") {
  await page.getByRole("button", { name: `Actions for ${name}` }).click();
  await page.getByRole("menuitem", { name: action }).click();
}

test.describe("CVs page, as an admin", () => {
  test.beforeEach(async ({ context, page }) => {
    await signIn(context, ADMIN_EMAIL);
    await page.goto("/en/cvs");
    await expect(page.getByRole("heading", { name: "CVs" })).toBeVisible();
    // The rows come with the server HTML; wait for React before the test types or clicks.
    await waitForHydration(search(page));
  });

  test("lists the CVs of all users, sorted by name ascending, with the owner email", async ({
    page,
  }) => {
    await expect(seedRows(page)).toHaveCount(SEED_COUNT);
    await expect(seedRows(page).first()).toContainText("Backend Developer");
    await expect(header(page, "Name")).toHaveAttribute("aria-sort", "ascending");
    await expect(row(page, "QA Engineer")).toContainText("user3@example.com");
    await expect(row(page, "Frontend Developer")).toContainText(USER_EMAIL);
    await expect(pagination(page)).toBeHidden();
  });

  test("a click on Name switches between descending and ascending, never to no sort", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Name" }).click();
    await expect(header(page, "Name")).toHaveAttribute("aria-sort", "descending");
    await expect(dataRows(page).first()).toContainText("QA Engineer");

    await page.getByRole("button", { name: "Name" }).click();
    await expect(header(page, "Name")).toHaveAttribute("aria-sort", "ascending");
    await expect(seedRows(page).first()).toContainText("Backend Developer");
  });

  test("searches the name and the owner email, without regard to case", async ({ page }) => {
    await find(page, "QA ENGINEER");
    await expect(dataRows(page)).toHaveCount(1);
    await expect(dataRows(page).first()).toContainText("QA Engineer");

    await find(page, "USER2@example");
    await expect(dataRows(page)).toHaveCount(1);
    await expect(seedRows(page).first()).toContainText("Backend Developer");
  });

  test("shows No CVs found when the search matches nothing, and keeps the search text", async ({
    page,
  }) => {
    await find(page, "no such cv");

    await expect(page.getByText("No CVs found")).toBeVisible();
    await expect(search(page)).toHaveValue("no such cv");
    await expect(row(page, "QA Engineer")).toHaveCount(0);
  });

  test("a click on a row opens the CV Preview page", async ({ page }) => {
    await row(page, "QA Engineer").getByRole("cell").first().click();

    await expect(page).toHaveURL(/\/en\/cvs\/[\w-]+\/preview$/);
  });

  test("View in the row menu opens the CV Preview page", async ({ page }) => {
    await openRowMenu(page, "QA Engineer", "View");

    await expect(page).toHaveURL(/\/en\/cvs\/[\w-]+\/preview$/);
  });

  test("the row menu does not open the CV by itself", async ({ page }) => {
    await page.getByRole("button", { name: "Actions for QA Engineer" }).click();

    await expect(page.getByRole("menuitem", { name: "View" })).toBeVisible();
    await expect(page).toHaveURL(/\/en\/cvs$/);
  });
});

test.describe("CVs page, as a user", () => {
  test.beforeEach(async ({ context, page }) => {
    await signIn(context, USER_EMAIL);
    await page.goto("/en/cvs");
    await expect(page.getByRole("heading", { name: "CVs" })).toBeVisible();
    // The rows come with the server HTML; wait for React before the test types or clicks.
    await waitForHydration(search(page));
  });

  test("lists only the own CVs", async ({ page }) => {
    await expect(seedRows(page)).toHaveCount(USER_SEED_COUNT);
    await expect(row(page, "Frontend Developer")).toContainText(USER_EMAIL);
    await expect(page.getByText("QA Engineer")).toBeHidden();
  });

  test("a search by the email of another user finds nothing", async ({ page }) => {
    await find(page, "user3@example");

    await expect(page.getByText("No CVs found")).toBeVisible();
  });
});

test.describe("CVs page, as the server renders it (no client code)", () => {
  test.use({ javaScriptEnabled: false });

  test("has the first page of CVs in the HTML", async ({ context, page }) => {
    await signIn(context, ADMIN_EMAIL);

    await page.goto("/en/cvs");

    await expect(serverRows(page).first()).toContainText("Backend Developer");
    await expect(serverRows(page).filter({ hasText: "QA Engineer" })).toContainText(
      "user3@example.com",
    );
  });
});

// Create, update and delete share this file with the list tests on purpose: the tests of one file run one after
// another, and these add CVs that the "5 seeded CVs" checks above must never see. Every CV these tests make has
// this text in its name, so `afterEach` can remove all of them (also after a test failed halfway).
const MANAGE_PREFIX = "E2E Manage";

async function fillForm(page: Page, values: { name: string; education: string }) {
  await dialog(page).getByRole("textbox", { name: "Name" }).fill(values.name);
  await dialog(page).getByRole("textbox", { name: "Education" }).fill(values.education);
  await dialog(page).getByRole("textbox", { name: "Description" }).fill("Made by an E2E test.");
}

test.describe("CVs page, create, update and delete (as a user)", () => {
  test.beforeEach(async ({ context, page }) => {
    await signIn(context, USER_EMAIL);
    await page.goto("/en/cvs");
    await expect(page.getByRole("heading", { name: "CVs" })).toBeVisible();
    // The rows come with the server HTML; wait for React before the test types or clicks.
    await waitForHydration(search(page));
  });

  test.afterEach(async ({ context }) => {
    await deleteCvsByName(context, MANAGE_PREFIX);
  });

  test("creates a CV: the modal closes, a toast shows and the row is in the list", async ({
    page,
  }) => {
    const name = `${MANAGE_PREFIX} Created`;

    await page.getByRole("button", { name: "CREATE CV" }).click();
    await expect(dialog(page).getByRole("button", { name: "Create" })).toBeDisabled();
    await fillForm(page, { name, education: "MSc E2E" });
    await dialog(page).getByRole("button", { name: "Create" }).click();

    await expect(dialog(page)).toBeHidden();
    await expect(page.getByText("CV created", { exact: true })).toBeVisible();
    await find(page, name);
    await expect(row(page, name)).toHaveCount(1);
    await expect(row(page, name)).toContainText("MSc E2E");
    await expect(row(page, name)).toContainText(USER_EMAIL);
  });

  test("shows the messages of the page document and keeps CREATE disabled", async ({ page }) => {
    await page.getByRole("button", { name: "CREATE CV" }).click();
    const name = dialog(page).getByRole("textbox", { name: "Name" });

    await name.fill("x".repeat(256));
    await name.press("Tab");

    await expect(dialog(page).getByText("Name must not exceed 255 characters")).toBeVisible();
    await name.fill("");
    await name.press("Tab");
    await expect(dialog(page).getByText("Name is required")).toBeVisible();
    await expect(dialog(page).getByRole("button", { name: "Create" })).toBeDisabled();
  });

  test("updates a CV: the modal starts filled and the new name shows in the list", async ({
    page,
  }) => {
    const name = `${MANAGE_PREFIX} Before`;
    const renamed = `${MANAGE_PREFIX} After`;
    await page.getByRole("button", { name: "CREATE CV" }).click();
    await fillForm(page, { name, education: "BSc E2E" });
    await dialog(page).getByRole("button", { name: "Create" }).click();
    await expect(dialog(page)).toBeHidden();
    await find(page, name);

    await openRowMenu(page, name, "Edit");
    await expect(dialog(page).getByRole("textbox", { name: "Name" })).toHaveValue(name);
    await expect(dialog(page).getByRole("textbox", { name: "Education" })).toHaveValue("BSc E2E");
    // The click ends the selection guard of the modal (see `useFirstFieldFocus`); without it `fill` can add the text to the old name.
    await dialog(page).getByRole("textbox", { name: "Name" }).click();
    await dialog(page).getByRole("textbox", { name: "Name" }).fill(renamed);
    await dialog(page).getByRole("button", { name: "Save" }).click();

    await expect(dialog(page)).toBeHidden();
    await expect(page.getByText("CV updated", { exact: true })).toBeVisible();
    await find(page, renamed);
    await expect(row(page, renamed)).toHaveCount(1);
  });

  test("Cancel in the delete modal keeps the CV, Confirm removes it", async ({ context, page }) => {
    await createCvs(context, `${MANAGE_PREFIX} Delete`, 1);
    const name = `${MANAGE_PREFIX} Delete 1`;
    await page.reload();
    await find(page, name);

    await openRowMenu(page, name, "Delete");
    await expect(confirmDialog(page)).toContainText(`Are you sure you want to delete CV ${name}?`);
    await confirmDialog(page).getByRole("button", { name: "Cancel" }).click();
    await expect(confirmDialog(page)).toBeHidden();
    await expect(row(page, name)).toHaveCount(1);

    await openRowMenu(page, name, "Delete");
    await confirmDialog(page).getByRole("button", { name: "Confirm" }).click();

    await expect(confirmDialog(page)).toBeHidden();
    await expect(row(page, name)).toHaveCount(0);
  });

  test("goes back one page after the only CV of the last page is deleted", async ({
    context,
    page,
  }) => {
    // The user has 2 seeded CVs, so 9 more make 11: ten on page 1 and one on page 2. The names start with zzz, so
    // the last one is on page 2 and the test never deletes a seeded CV.
    await createCvs(context, `zzz ${MANAGE_PREFIX} Many`, PAGE_SIZE - USER_SEED_COUNT + 1);
    await page.reload();
    await pagination(page).getByRole("button", { name: "Page 2" }).click();
    await expect(dataRows(page)).toHaveCount(1);
    const name = (await dataRows(page).first().getByRole("cell").first().innerText()).trim();

    await openRowMenu(page, name, "Delete");
    await confirmDialog(page).getByRole("button", { name: "Confirm" }).click();

    await expect(confirmDialog(page)).toBeHidden();
    await expect(dataRows(page)).toHaveCount(PAGE_SIZE);
    await expect(pagination(page)).toBeHidden();
  });
});
