import { expect, test, type Page } from "@playwright/test";
import { createProjects, deleteProjects } from "../support/projects";
import { ADMIN_EMAIL, signIn, USER_EMAIL } from "../support/signIn";

// The seed holds 6 projects (backend/prisma/seed/projects.data.ts). The page shows 10 rows (PLAN D19).
const SEED_COUNT = 6;
const PAGE_SIZE = 10;

const search = (page: Page) => page.getByRole("searchbox", { name: "Search projects" });
const header = (page: Page, name: string) => page.getByRole("columnheader", { name });
const pagination = (page: Page) => page.getByRole("navigation", { name: "Projects pagination" });
// Rows with data cells: the header row has none.
const dataRows = (page: Page) => page.getByRole("row").filter({ has: page.getByRole("cell") });

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
