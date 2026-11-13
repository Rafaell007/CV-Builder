import { expect, test, type Page } from "@playwright/test";
import {
  createProject,
  createProjects,
  deleteProjects,
  deleteProjectsByName,
} from "../support/projects";
import { ADMIN_EMAIL, signIn, USER_EMAIL } from "../support/signIn";

// The seed holds 6 projects (backend/prisma/seed/projects.data.ts). The page shows 10 rows (PLAN D19).
const SEED_COUNT = 6;
const PAGE_SIZE = 10;

const search = (page: Page) => page.getByRole("searchbox", { name: "Search projects" });
const header = (page: Page, name: string) => page.getByRole("columnheader", { name });
const pagination = (page: Page) => page.getByRole("navigation", { name: "Projects pagination" });
// Rows with data cells: the header row has none. The detail line under a project (description and
// tags) is a row too; the table marks it with data-row-detail, so it is left out here.
const dataRows = (page: Page) =>
  page.locator("tbody tr:not([data-row-detail])").filter({ has: page.getByRole("cell") });

test.describe("projects page, as an admin", () => {
  test.beforeEach(async ({ context, page }) => {
    await signIn(context, ADMIN_EMAIL);
    await page.goto("/en/admin/projects");
    await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
  });

  test("lists the seeded projects, sorted by name ascending, with the Name arrow shown", async ({
    page,
  }) => {
    await expect(dataRows(page)).toHaveCount(SEED_COUNT);
    await expect(dataRows(page).first()).toContainText("Banking Portal");
    await expect(header(page, "Name")).toHaveAttribute("aria-sort", "ascending");
    await expect(header(page, "Start Date")).toHaveAttribute("aria-sort", "none");
    await expect(pagination(page)).toBeHidden();
  });

  test("a click on Name switches between descending and ascending, never to no sort", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Name" }).click();
    await expect(header(page, "Name")).toHaveAttribute("aria-sort", "descending");
    await expect(dataRows(page).first()).toContainText("Travel Booking App");

    await page.getByRole("button", { name: "Name" }).click();
    await expect(header(page, "Name")).toHaveAttribute("aria-sort", "ascending");
    await expect(dataRows(page).first()).toContainText("Banking Portal");
  });

  test("sorts by the start date, oldest first and then newest first", async ({ page }) => {
    await page.getByRole("button", { name: "Start Date" }).click();
    await expect(header(page, "Start Date")).toHaveAttribute("aria-sort", "ascending");
    await expect(dataRows(page).first()).toContainText("Travel Booking App");

    await page.getByRole("button", { name: "Start Date" }).click();
    await expect(header(page, "Start Date")).toHaveAttribute("aria-sort", "descending");
    await expect(dataRows(page).first()).toContainText("Learning Management Platform");
  });

  test("searches the name and the domain, with Enter and without regard to case", async ({
    page,
  }) => {
    await search(page).fill("BANK");
    await search(page).press("Enter");
    await expect(dataRows(page)).toHaveCount(1);
    await expect(dataRows(page).first()).toContainText("Banking Portal");

    await search(page).fill("retail");
    await search(page).press("Enter");
    await expect(dataRows(page)).toHaveCount(1);
    await expect(dataRows(page).first()).toContainText("E-commerce Marketplace");
  });

  test("searches after a short wait, without Enter", async ({ page }) => {
    await search(page).pressSequentially("travel");

    await expect(dataRows(page)).toHaveCount(1);
    await expect(dataRows(page).first()).toContainText("Travel Booking App");
  });

  test("shows No projects found and keeps the typed text when nothing matches", async ({
    page,
  }) => {
    await search(page).fill("zzzz");
    await search(page).press("Enter");

    await expect(page.getByText("No projects found")).toBeVisible();
    await expect(search(page)).toHaveValue("zzzz");

    await search(page).fill("");
    await search(page).press("Enter");
    await expect(dataRows(page)).toHaveCount(SEED_COUNT);
  });

  test("keeps the search when the sort changes", async ({ page }) => {
    await search(page).fill("o");
    await search(page).press("Enter");
    await page.getByRole("button", { name: "Start Date" }).click();

    await expect(header(page, "Start Date")).toHaveAttribute("aria-sort", "ascending");
    await expect(search(page)).toHaveValue("o");
  });

  test("shows the page in Polish", async ({ page }) => {
    await page.goto("/pl/admin/projects");

    await expect(page.getByRole("heading", { name: "Projekty" })).toBeVisible();
    await expect(dataRows(page)).toHaveCount(SEED_COUNT);
  });
});

test.describe("projects page, with more than one page", () => {
  const EXTRA_COUNT = 6;
  const PREFIX = "E2E Paging Project";
  let createdIds: string[] = [];

  test.beforeEach(async ({ context, page }) => {
    await signIn(context, ADMIN_EMAIL);
    createdIds = await createProjects(context, PREFIX, EXTRA_COUNT);
    await page.goto("/en/admin/projects");
    await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
  });

  // The extra projects are removed, so the other specs see the seed data only.
  test.afterEach(async ({ context }) => {
    await deleteProjects(context, createdIds);
  });

  test("shows 10 projects on page 1 and the rest on page 2", async ({ page }) => {
    await expect(dataRows(page)).toHaveCount(PAGE_SIZE);
    await expect(pagination(page).getByRole("button", { name: "Page 1" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await pagination(page).getByRole("button", { name: "Page 2" }).click();

    await expect(pagination(page).getByRole("button", { name: "Page 2" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(dataRows(page)).toHaveCount(SEED_COUNT + EXTRA_COUNT - PAGE_SIZE);
  });

  test("goes back to page 1 when the sort changes", async ({ page }) => {
    await pagination(page).getByRole("button", { name: "Page 2" }).click();
    await expect(pagination(page).getByRole("button", { name: "Page 2" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await page.getByRole("button", { name: "Name" }).click();

    await expect(header(page, "Name")).toHaveAttribute("aria-sort", "descending");
    await expect(pagination(page).getByRole("button", { name: "Page 1" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(dataRows(page)).toHaveCount(PAGE_SIZE);
  });

  test("goes back to page 1 when the search changes, and hides the pages that fit on one", async ({
    page,
  }) => {
    await pagination(page).getByRole("button", { name: "Page 2" }).click();
    await expect(pagination(page).getByRole("button", { name: "Page 2" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await search(page).fill(PREFIX);
    await search(page).press("Enter");

    await expect(dataRows(page)).toHaveCount(EXTRA_COUNT);
    await expect(pagination(page)).toBeHidden();
  });
});

test.describe("projects page, as a user", () => {
  test("a user without the Admin role does not get the list", async ({ context, page }) => {
    await signIn(context, USER_EMAIL);

    await page.goto("/en/admin/projects");

    await expect(page).toHaveURL(/\/users$/);
  });
});

// Create, update and delete share this file with the list tests on purpose: the tests of one file run one after
// another, and these add projects that the "6 seeded projects" checks above must never see.
// Every project these tests make has this text in its name, so `afterEach` can remove all of them (also after a test failed halfway).
const MANAGE_PREFIX = "E2E Manage";

const row = (page: Page, name: string) => dataRows(page).filter({ hasText: name });
const dialog = (page: Page) => page.getByRole("dialog");
// The delete modal is a ConfirmModal, which Radix marks as an alertdialog.
const confirmDialog = (page: Page) => page.getByRole("alertdialog");

async function find(page: Page, text: string) {
  await search(page).fill(text);
  await search(page).press("Enter");
}

async function fillForm(page: Page, name: string) {
  await dialog(page).getByRole("textbox", { name: "Name" }).fill(name);
  await dialog(page).getByRole("textbox", { name: "Domain" }).fill("E2E");
  await fillDate(page, "Start Date", "01/10/2026");
  await fillDate(page, "End Date", "06/30/2026");
  await dialog(page).getByRole("textbox", { name: "Description" }).fill("Made by an E2E test.");
}

// Opens the Environment list, picks the skills and leaves the field with Tab, so the list closes.
async function chooseTechnologies(page: Page, names: string[]) {
  const field = dialog(page).getByRole("combobox", { name: "Environment" });
  await expect(field).not.toHaveAttribute("aria-disabled", "true");
  await field.click();
  for (const name of names) await dialog(page).getByRole("option", { name }).click();
  await field.press("Tab");
}

// Tab leaves the field, so the calendar popup closes; an open popup covers the buttons of the modal.
async function fillDate(page: Page, label: "Start Date" | "End Date", value: string) {
  const field = dialog(page).getByRole("textbox", { name: label });
  await field.fill(value);
  await field.press("Tab");
}

async function openRowMenu(page: Page, name: string, action: "Edit" | "Delete") {
  await page.getByRole("button", { name: `Actions for ${name}` }).click();
  await page.getByRole("menuitem", { name: action }).click();
}

test.describe("projects page, create, update and delete", () => {
  test.beforeEach(async ({ context, page }) => {
    await signIn(context, ADMIN_EMAIL);
    await page.goto("/en/admin/projects");
    await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
  });

  test.afterEach(async ({ context }) => {
    await deleteProjectsByName(context, MANAGE_PREFIX);
  });

  test("creates a project: the modal closes, a toast shows and the row is in the list", async ({
    page,
  }) => {
    const name = `${MANAGE_PREFIX} Created`;

    await page.getByRole("button", { name: "CREATE PROJECT" }).click();
    await expect(dialog(page).getByRole("button", { name: "Create" })).toBeDisabled();
    await fillForm(page, name);
    await dialog(page).getByRole("button", { name: "Create" }).click();

    await expect(dialog(page)).toBeHidden();
    await expect(page.getByText("Project created", { exact: true })).toBeVisible();
    await find(page, name);
    await expect(row(page, name)).toHaveCount(1);
    await expect(row(page, name)).toContainText("E2E");
  });

  test("creates a project with technologies, then removes one of them with Update", async ({
    page,
  }) => {
    const name = `${MANAGE_PREFIX} Technologies`;

    await page.getByRole("button", { name: "CREATE PROJECT" }).click();
    await fillForm(page, name);
    await chooseTechnologies(page, ["React", "Docker"]);
    await dialog(page).getByRole("button", { name: "Create" }).click();

    await expect(dialog(page)).toBeHidden();
    await find(page, name);
    const tags = row(page, name).getByRole("list", { name: "Environment" });
    await expect(tags.getByRole("listitem")).toHaveText(["Docker", "React"]);

    await openRowMenu(page, name, "Edit");
    await expect(dialog(page).getByRole("button", { name: "Remove React" })).toBeVisible();
    await dialog(page).getByRole("button", { name: "Remove React" }).click();
    await dialog(page).getByRole("button", { name: "Update" }).click();

    await expect(dialog(page)).toBeHidden();
    await expect(tags.getByRole("listitem")).toHaveText(["Docker"]);
  });

  test("Update opens with the technologies of the project as chips", async ({ page }) => {
    // The seed project Banking Portal has six technologies; the form must start with all of them.
    await find(page, "Banking Portal");
    const tags = row(page, "Banking Portal").getByRole("list", { name: "Environment" });
    await expect(tags.getByRole("listitem")).toHaveCount(6);

    await openRowMenu(page, "Banking Portal", "Edit");
    await expect(dialog(page).getByRole("button", { name: "Remove Docker" })).toBeVisible();
    await dialog(page).getByRole("button", { name: "Cancel" }).click();

    await expect(dialog(page)).toBeHidden();
    await expect(tags.getByRole("listitem")).toHaveCount(6);
  });

  test("shows the date message and keeps Create disabled when the end is before the start", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "CREATE PROJECT" }).click();
    await fillForm(page, `${MANAGE_PREFIX} Dates`);
    await fillDate(page, "End Date", "01/01/2026");

    await expect(dialog(page).getByText("End date must be later than start date")).toBeVisible();
    await expect(dialog(page).getByRole("button", { name: "Create" })).toBeDisabled();
  });

  test("Cancel closes the create modal and saves nothing", async ({ page }) => {
    const name = `${MANAGE_PREFIX} Cancelled`;

    await page.getByRole("button", { name: "CREATE PROJECT" }).click();
    await fillForm(page, name);
    await dialog(page).getByRole("button", { name: "Cancel" }).click();

    await expect(dialog(page)).toBeHidden();
    await find(page, name);
    await expect(page.getByText("No projects found")).toBeVisible();
  });

  test("updates a project: the form is filled, the new name shows in the list", async ({
    context,
    page,
  }) => {
    const name = `${MANAGE_PREFIX} Before`;
    const renamed = `${MANAGE_PREFIX} After`;
    await createProject(context, name);
    await page.reload();
    await find(page, name);

    await openRowMenu(page, name, "Edit");
    await expect(dialog(page).getByRole("textbox", { name: "Name" })).toHaveValue(name);
    await expect(dialog(page).getByRole("textbox", { name: "Start Date" })).toHaveValue(
      "01/01/2024",
    );
    await expect(dialog(page).getByRole("button", { name: "Update" })).toBeDisabled();
    await dialog(page).getByRole("textbox", { name: "Name" }).fill(renamed);
    await dialog(page).getByRole("button", { name: "Update" }).click();

    await expect(dialog(page)).toBeHidden();
    await expect(page.getByText("Project updated", { exact: true })).toBeVisible();
    await find(page, renamed);
    await expect(row(page, renamed)).toHaveCount(1);
    await find(page, name);
    await expect(page.getByText("No projects found")).toBeVisible();
  });

  test("deletes a project that no CV uses", async ({ context, page }) => {
    const name = `${MANAGE_PREFIX} Delete me`;
    await createProject(context, name);
    await page.reload();
    await find(page, name);

    await openRowMenu(page, name, "Delete");
    await expect(confirmDialog(page)).toContainText(
      `Are you sure you want to delete project ${name}?`,
    );
    await confirmDialog(page).getByRole("button", { name: "Confirm" }).click();

    await expect(confirmDialog(page)).toBeHidden();
    await expect(page.getByText("No projects found")).toBeVisible();
  });

  test("Cancel keeps the project in the list", async ({ context, page }) => {
    const name = `${MANAGE_PREFIX} Keep me`;
    await createProject(context, name);
    await page.reload();
    await find(page, name);

    await openRowMenu(page, name, "Delete");
    await confirmDialog(page).getByRole("button", { name: "Cancel" }).click();

    await expect(confirmDialog(page)).toBeHidden();
    await expect(row(page, name)).toHaveCount(1);
  });

  test("shows the backend message and keeps the row when a CV uses the project", async ({
    page,
  }) => {
    // The seed uses Banking Portal in two CVs (backend/prisma/seed/cvs.data.ts).
    await openRowMenu(page, "Banking Portal", "Delete");
    await confirmDialog(page).getByRole("button", { name: "Confirm" }).click();

    await expect(confirmDialog(page)).toBeHidden();
    // Radix adds a second, hidden copy of the toast text for screen readers: match the visible title exactly.
    await expect(page.getByText("Could not delete the project", { exact: true })).toBeVisible();
    await expect(page.getByText(/^The project is used in \d+ CVs?$/)).toBeVisible();
    await expect(row(page, "Banking Portal")).toHaveCount(1);
  });
});
