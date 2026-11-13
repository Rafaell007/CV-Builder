import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { createCvs, deleteCvsByName } from "../support/cvs";
import { addCvProjectsByName, type CvProjectEntry } from "../support/cvProjects";
import { ADMIN_EMAIL, signIn, USER_EMAIL } from "../support/signIn";

// Every CV that a test makes has this prefix, so `afterEach` can remove it, also after a test failed halfway.
// A CV takes its projects with it, so there is nothing else to clean up.
const PREFIX = "E2E Projects";

// Seed (backend/prisma/seed/projects.data.ts): Banking Portal (Finance) lasts from 2022-01-10 to 2023-06-30,
// E-commerce Marketplace (Retail) from 2023-02-01 to 2024-05-31 and Hospital Appointment System (Healthcare)
// from 2021-03-01 to 2022-02-28. The roles Developer and Team Lead are in the seed too.
const BANKING: CvProjectEntry = {
  project: "Banking Portal",
  startDate: "2022-03-01",
  endDate: "2023-06-30",
  roles: ["Developer"],
  responsibilities: "Built the transfer screens.",
};
const MARKETPLACE: CvProjectEntry = {
  project: "E-commerce Marketplace",
  startDate: "2023-09-01",
  roles: ["Developer", "Team Lead"],
};

const addDialog = (page: Page) => page.getByRole("dialog", { name: "Add project" });
const updateDialog = (page: Page) => page.getByRole("dialog", { name: "Update project" });
const removeDialog = (page: Page) => page.getByRole("alertdialog", { name: "Remove project" });
const rows = (page: Page) => page.getByRole("row").filter({ has: page.getByRole("cell") });
const row = (page: Page, name: string) => page.getByRole("row", { name: new RegExp(name) });

async function openRowMenu(page: Page, name: string, action: "Update" | "Delete") {
  await page.getByRole("button", { name: `Actions for ${name}` }).click();
  await page.getByRole("menuitem", { name: action }).click();
}

/** The admin session that fills the catalog-dependent set-up. It is a second browser context. */
async function adminSession(browser: {
  newContext: () => Promise<BrowserContext>;
}): Promise<BrowserContext> {
  const context = await browser.newContext();
  await signIn(context, ADMIN_EMAIL);
  return context;
}

test.describe("CV Projects page, as a user", () => {
  let cvId: string;
  const name = `${PREFIX} user`;

  test.beforeEach(async ({ browser, context }) => {
    await signIn(context, USER_EMAIL);
    [cvId = ""] = await createCvs(context, name, 1);
    const admin = await adminSession(browser);
    try {
      await addCvProjectsByName(admin, cvId, [BANKING, MARKETPLACE]);
    } finally {
      await admin.close();
    }
  });

  test.afterEach(async ({ context }) => {
    await deleteCvsByName(context, PREFIX);
  });

  test("shows the Projects tab as active, the breadcrumbs and the projects of the CV", async ({
    page,
  }) => {
    await page.goto(`/en/cvs/${cvId}/projects`);

    await expect(
      page.getByRole("navigation", { name: "CV sections" }).getByRole("link", { name: "Projects" }),
    ).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("navigation", { name: "Breadcrumbs" })).toContainText(`${name} 1`);
    await expect(page.getByRole("columnheader").filter({ hasText: /\S/ })).toContainText([
      "Name",
      "Domain",
      "Responsibilities",
      "Start Date",
      "End Date",
    ]);
    await expect(rows(page)).toHaveCount(2);
    const banking = row(page, "Banking Portal");
    await expect(banking).toContainText("Finance");
    await expect(banking).toContainText("Built the transfer screens.");
    await expect(banking).toContainText("03/01/2022");
    await expect(banking).toContainText("06/30/2023");
    // The marketplace has no end date: the person still works on it.
    await expect(row(page, "E-commerce Marketplace")).toContainText("Present");
  });

  test("searches by name and by domain without case, and clears the search", async ({ page }) => {
    await page.goto(`/en/cvs/${cvId}/projects`);
    const search = page.getByRole("searchbox", { name: "Search projects" });

    await search.fill("BANKING");
    await expect(rows(page)).toHaveCount(1);
    await expect(row(page, "Banking Portal")).toBeVisible();

    await search.fill("retail");
    await expect(rows(page)).toHaveCount(1);
    await expect(row(page, "E-commerce Marketplace")).toBeVisible();

    await search.fill("nothing like this");
    await expect(page.getByText("No projects found")).toBeVisible();
    await expect(search).toHaveValue("nothing like this");

    await search.clear();
    await expect(rows(page)).toHaveCount(2);
  });

  test("sorts by start date in both directions, and by name", async ({ page }) => {
    await page.goto(`/en/cvs/${cvId}/projects`);
    await expect(rows(page)).toHaveCount(2);
    // Name ascending is the order at the start.
    await expect(rows(page).first()).toContainText("Banking Portal");

    await page.getByRole("button", { name: "Start Date" }).click();
    await expect(page.getByRole("columnheader", { name: "Start Date" })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
    await expect(rows(page).first()).toContainText("Banking Portal");

    await page.getByRole("button", { name: "Start Date" }).click();
    await expect(page.getByRole("columnheader", { name: "Start Date" })).toHaveAttribute(
      "aria-sort",
      "descending",
    );
    await expect(rows(page).first()).toContainText("E-commerce Marketplace");
  });

  test("updates the responsibilities in the Update modal, with the project locked, and keeps them after a reload", async ({
    page,
  }) => {
    await page.goto(`/en/cvs/${cvId}/projects`);
    await openRowMenu(page, "Banking Portal", "Update");

    const dialog = updateDialog(page);
    await expect(dialog).toBeVisible();
    // The fields of the catalog project cannot change.
    await expect(dialog.getByRole("combobox", { name: "Name" })).toBeDisabled();
    await expect(dialog.getByRole("textbox", { name: "Domain" })).toHaveValue("Finance");
    await expect(dialog.getByRole("textbox", { name: "Domain" })).toBeDisabled();
    await expect(dialog.getByRole("textbox", { name: "Description" })).toBeDisabled();
    const save = dialog.getByRole("button", { name: "Save" });
    await expect(save).toBeDisabled();

    await dialog
      .getByRole("textbox", { name: "Responsibilities" })
      .fill("Led the transfer screens.");
    await expect(save).toBeEnabled();
    await save.click();

    await expect(page.getByText("Project updated", { exact: true })).toBeVisible();
    await expect(dialog).toBeHidden();
    await expect(row(page, "Banking Portal")).toContainText("Led the transfer screens.");
    await page.reload();
    await expect(row(page, "Banking Portal")).toContainText("Led the transfer screens.");
  });

  test("shows an inline message for an end date earlier than the start date, and keeps SAVE disabled", async ({
    page,
  }) => {
    await page.goto(`/en/cvs/${cvId}/projects`);
    await openRowMenu(page, "Banking Portal", "Update");
    const dialog = updateDialog(page);

    await dialog.getByRole("textbox", { name: "End Date" }).fill("01/15/2022");
    await dialog.getByRole("textbox", { name: "End Date" }).blur();

    await expect(dialog.getByText("End date cannot be earlier than start date")).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  test("removes a project after a confirmation, a cancel removes nothing, and the project stays in the catalog", async ({
    page,
  }) => {
    await page.goto(`/en/cvs/${cvId}/projects`);

    await openRowMenu(page, "Banking Portal", "Delete");
    await expect(removeDialog(page)).toContainText(
      "Are you sure you want to remove project Banking Portal?",
    );
    await removeDialog(page).getByRole("button", { name: "Cancel" }).click();
    await expect(removeDialog(page)).toBeHidden();
    await expect(rows(page)).toHaveCount(2);

    await openRowMenu(page, "Banking Portal", "Delete");
    await removeDialog(page).getByRole("button", { name: "Confirm" }).click();

    await expect(page.getByText("Project removed", { exact: true })).toBeVisible();
    await expect(removeDialog(page)).toBeHidden();
    await expect(rows(page)).toHaveCount(1);
    await expect(row(page, "Banking Portal")).toBeHidden();
    await page.reload();
    await expect(rows(page)).toHaveCount(1);
  });

  test("Escape closes the row menu and the modal without a change", async ({ page }) => {
    await page.goto(`/en/cvs/${cvId}/projects`);

    await page.getByRole("button", { name: "Actions for Banking Portal" }).click();
    await expect(page.getByRole("menuitem", { name: "Update" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menuitem", { name: "Update" })).toBeHidden();

    await openRowMenu(page, "Banking Portal", "Update");
    await expect(updateDialog(page)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(updateDialog(page)).toBeHidden();
  });
});

test.describe("CV Projects page, empty CV", () => {
  test("shows the empty state and keeps ADD PROJECT available", async ({ context, page }) => {
    await signIn(context, USER_EMAIL);
    const [cvId = ""] = await createCvs(context, `${PREFIX} empty`, 1);
    try {
      await page.goto(`/en/cvs/${cvId}/projects`);

      await expect(page.getByText("No projects added yet")).toBeVisible();
      await expect(page.getByRole("button", { name: "ADD PROJECT" })).toBeEnabled();
    } finally {
      await deleteCvsByName(context, PREFIX);
    }
  });
});

test.describe("CV Projects page, as an admin", () => {
  test("an admin adds a project to the CV of a user: the form fills from the catalog, needs a role, and the project is kept", async ({
    browser,
    context,
    page,
  }) => {
    const ownerContext = await browser.newContext();
    await signIn(ownerContext, USER_EMAIL);
    const [cvId = ""] = await createCvs(ownerContext, `${PREFIX} owner`, 1);
    try {
      await signIn(context, ADMIN_EMAIL);
      await page.goto(`/en/cvs/${cvId}/projects`);
      await page.getByRole("button", { name: "ADD PROJECT" }).click();
      const dialog = addDialog(page);
      await expect(dialog).toBeVisible();
      const project = dialog.getByRole("combobox", { name: "Name" });
      await expect(project).toBeEnabled();
      await expect(dialog.getByRole("button", { name: "Add", exact: true })).toBeDisabled();

      await project.click();
      await page.getByRole("option", { name: "Hospital Appointment System", exact: true }).click();

      // The catalog fills the read-only fields and the two dates (2021-03-01 to 2022-02-28).
      await expect(dialog.getByRole("textbox", { name: "Domain" })).toHaveValue("Healthcare");
      await expect(dialog.getByRole("textbox", { name: "Domain" })).toBeDisabled();
      await expect(dialog.getByRole("textbox", { name: "Description" })).toBeDisabled();
      await expect(dialog.getByRole("textbox", { name: "Start Date" })).toHaveValue("03/01/2021");
      await expect(dialog.getByRole("textbox", { name: "End Date" })).toHaveValue("02/28/2022");
      // A project alone is not enough: at least one role is needed.
      await expect(dialog.getByRole("button", { name: "Add", exact: true })).toBeDisabled();

      await dialog.getByRole("combobox", { name: "Roles" }).click();
      await page.getByRole("option", { name: "Developer", exact: true }).click();
      await dialog
        .getByRole("textbox", { name: "Responsibilities" })
        .fill("Built the booking screens.");
      await expect(dialog.getByRole("button", { name: "Add", exact: true })).toBeEnabled();
      await dialog.getByRole("button", { name: "Add", exact: true }).click();

      await expect(page.getByText("Project added", { exact: true })).toBeVisible();
      await expect(dialog).toBeHidden();
      await expect(row(page, "Hospital Appointment System")).toContainText("Healthcare");
      await expect(row(page, "Hospital Appointment System")).toContainText(
        "Built the booking screens.",
      );

      await page.reload();
      await expect(row(page, "Hospital Appointment System")).toBeVisible();
      // A project that the CV holds is not offered again.
      await page.getByRole("button", { name: "ADD PROJECT" }).click();
      const again = addDialog(page).getByRole("combobox", { name: "Name" });
      await expect(again).toBeEnabled();
      await again.click();
      await expect(
        page.getByRole("option", { name: "Hospital Appointment System", exact: true }),
      ).toBeHidden();
      await expect(page.getByRole("option", { name: "Banking Portal", exact: true })).toBeVisible();
    } finally {
      await deleteCvsByName(ownerContext, PREFIX);
      await ownerContext.close();
    }
  });
});
