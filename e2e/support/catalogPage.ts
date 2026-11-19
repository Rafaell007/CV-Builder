import { expect, test, type Page } from "@playwright/test";
import { createCatalogItem, deleteCatalogItemsByName, type Catalog } from "./catalogs";
import { ADMIN_EMAIL, signIn, USER_EMAIL } from "./signIn";

/** What differs between the Departments and the Positions page. Everything else is the shared CatalogPage. */
export interface CatalogPageCase {
  catalog: Catalog;
  path: string;
  /** Title, plural ("Departments") and singular ("Department"), as the page shows them in English. */
  title: string;
  singular: string;
  polishTitle: string;
  /** The seed rows (backend/prisma/seed/catalogs.data.ts), in name order (letter case ignored). */
  seed: readonly string[];
  /** A seed row a seed user has, so it cannot be deleted (backend/prisma/seed/users.data.ts). */
  inUse: string;
  /** A search in a different letter case and the one seed row it finds. */
  search: { text: string; finds: string };
}

const PAGE_SIZE = 10;

/**
 * The E2E tests of one catalog page. The tests of one file run one after another: the tests that add rows remove them
 * in `afterEach`, so the seed checks never see them.
 */
export function describeCatalogPage(c: CatalogPageCase): void {
  const lower = c.singular.toLowerCase();
  // Every row these tests make has this text in its name, so `afterEach` can remove all of them.
  const PREFIX = `E2E ${c.singular}`;

  const search = (page: Page) =>
    page.getByRole("searchbox", { name: `Search ${c.title.toLowerCase()}` });
  const header = (page: Page) => page.getByRole("columnheader", { name: "Name" });
  const pagination = (page: Page) =>
    page.getByRole("navigation", { name: `${c.title} pagination` });
  const dataRows = (page: Page) => page.locator("tbody tr").filter({ has: page.getByRole("cell") });
  const row = (page: Page, name: string) => dataRows(page).filter({ hasText: name });
  const dialog = (page: Page) => page.getByRole("dialog");
  const confirmDialog = (page: Page) => page.getByRole("alertdialog");
  const field = (page: Page) => dialog(page).getByRole("textbox", { name: c.singular });

  async function find(page: Page, text: string) {
    await search(page).fill(text);
    await search(page).press("Enter");
  }

  async function openRowMenu(page: Page, name: string, action: "Edit" | "Delete") {
    await page.getByRole("button", { name: `Actions for ${name}` }).click();
    await page.getByRole("menuitem", { name: action }).click();
  }

  async function open(page: Page) {
    await page.goto(`/en${c.path}`);
    await expect(page.getByRole("heading", { name: c.title })).toBeVisible();
  }

  test.describe(`${lower} list, as an admin`, () => {
    test.beforeEach(async ({ context, page }) => {
      await signIn(context, ADMIN_EMAIL);
      await open(page);
    });

    test("lists the seed rows sorted by name ascending, without pages", async ({ page }) => {
      await expect(dataRows(page)).toHaveText(c.seed.map((name) => new RegExp(escape(name))));
      await expect(header(page)).toHaveAttribute("aria-sort", "ascending");
      await expect(pagination(page)).toBeHidden();
    });

    test("a click on Name sorts descending on the backend", async ({ page }) => {
      await page.getByRole("button", { name: "Name" }).click();

      await expect(header(page)).toHaveAttribute("aria-sort", "descending");
      await expect(dataRows(page).first()).toContainText(c.seed.at(-1)!);
    });

    test("searches without regard to letter case", async ({ page }) => {
      await find(page, c.search.text);

      await expect(dataRows(page)).toHaveCount(1);
      await expect(dataRows(page).first()).toContainText(c.search.finds);
    });

    test(`shows No ${c.title.toLowerCase()} found and keeps the text when nothing matches`, async ({
      page,
    }) => {
      await find(page, "zzzz");

      await expect(page.getByText(`No ${c.title.toLowerCase()} found`)).toBeVisible();
      await expect(search(page)).toHaveValue("zzzz");
    });

    test("shows the page in Polish", async ({ page }) => {
      await page.goto(`/pl${c.path}`);

      await expect(page.getByRole("heading", { name: c.polishTitle })).toBeVisible();
      await expect(dataRows(page)).toHaveCount(c.seed.length);
    });
  });

  test.describe(`${lower} list, as a user`, () => {
    test("a user without the Admin role does not get the list", async ({ context, page }) => {
      await signIn(context, USER_EMAIL);

      await page.goto(`/en${c.path}`);

      await expect(page).toHaveURL(/\/users$/);
    });
  });

  test.describe(`${lower}s, create, update, delete and pages`, () => {
    test.beforeEach(async ({ context, page }) => {
      await signIn(context, ADMIN_EMAIL);
      await open(page);
    });

    test.afterEach(async ({ context }) => {
      await deleteCatalogItemsByName(context, c.catalog, PREFIX);
    });

    test("shows 10 rows on page 1 and the rest on page 2", async ({ context, page }) => {
      const extra = PAGE_SIZE + 1 - c.seed.length;
      for (let number = 1; number <= extra; number += 1) {
        await createCatalogItem(context, c.catalog, `${PREFIX} ${number}`);
      }
      await page.reload();

      await expect(dataRows(page)).toHaveCount(PAGE_SIZE);
      await pagination(page).getByRole("button", { name: "Page 2" }).click();

      await expect(pagination(page).getByRole("button", { name: "Page 2" })).toHaveAttribute(
        "aria-current",
        "page",
      );
      await expect(dataRows(page)).toHaveCount(1);
    });

    test(`creates a ${lower}: the modal closes, a toast shows and the row is in the list`, async ({
      page,
    }) => {
      const name = `${PREFIX} Created`;

      await page.getByRole("button", { name: `CREATE ${c.singular.toUpperCase()}` }).click();
      await expect(dialog(page).getByRole("button", { name: "Create" })).toBeDisabled();
      await field(page).fill(name);
      await dialog(page).getByRole("button", { name: "Create" }).click();

      await expect(dialog(page)).toBeHidden();
      await expect(page.getByText(`${c.singular} created`, { exact: true })).toBeVisible();
      await find(page, name);
      await expect(row(page, name)).toHaveCount(1);
    });

    test("refuses a name that exists in another letter case and keeps the typed name", async ({
      page,
    }) => {
      const taken = c.seed[0]!.toUpperCase();

      await page.getByRole("button", { name: `CREATE ${c.singular.toUpperCase()}` }).click();
      await field(page).fill(taken);
      await dialog(page).getByRole("button", { name: "Create" }).click();

      await expect(dialog(page).getByText(`${c.singular} already exists`)).toBeVisible();
      await expect(field(page)).toHaveValue(taken);
    });

    test("shows the required message for an empty name", async ({ page }) => {
      await page.getByRole("button", { name: `CREATE ${c.singular.toUpperCase()}` }).click();
      await field(page).fill("   ");
      await field(page).press("Tab");

      await expect(dialog(page).getByText(`${c.singular} name is required`)).toBeVisible();
      await expect(dialog(page).getByRole("button", { name: "Create" })).toBeDisabled();
    });

    test(`updates a ${lower}: the form is filled, the new name shows in the list`, async ({
      context,
      page,
    }) => {
      const name = `${PREFIX} Before`;
      const renamed = `${PREFIX} After`;
      await createCatalogItem(context, c.catalog, name);
      await find(page, name);

      await openRowMenu(page, name, "Edit");
      await expect(field(page)).toHaveValue(name);
      await field(page).fill(renamed);
      await dialog(page).getByRole("button", { name: "Update" }).click();

      await expect(dialog(page)).toBeHidden();
      await expect(page.getByText(`${c.singular} updated`, { exact: true })).toBeVisible();
      await find(page, renamed);
      await expect(row(page, renamed)).toHaveCount(1);
    });

    test(`deletes a ${lower} that nothing uses`, async ({ context, page }) => {
      const name = `${PREFIX} Delete me`;
      await createCatalogItem(context, c.catalog, name);
      await find(page, name);

      await openRowMenu(page, name, "Delete");
      await expect(confirmDialog(page)).toContainText(
        `Are you sure you want to delete ${lower} ${name}?`,
      );
      await confirmDialog(page).getByRole("button", { name: "Confirm" }).click();

      await expect(confirmDialog(page)).toBeHidden();
      await expect(page.getByText(`No ${c.title.toLowerCase()} found`)).toBeVisible();
    });

    test(`shows the in-use text and keeps the row when a user has the ${lower}`, async ({
      page,
    }) => {
      await find(page, c.inUse);
      await openRowMenu(page, c.inUse, "Delete");
      await confirmDialog(page).getByRole("button", { name: "Confirm" }).click();

      await expect(confirmDialog(page)).toBeHidden();
      // Radix adds a second, hidden copy of the toast text for screen readers: match the visible text exactly.
      await expect(
        page.getByText(`${c.singular} cannot be deleted because it is currently in use`, {
          exact: true,
        }),
      ).toBeVisible();
      await expect(row(page, c.inUse)).toHaveCount(1);
    });
  });
}

function escape(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
