import { expect, test } from "@playwright/test";
import { deleteCvsByName } from "../support/cvs";
import { ADMIN_EMAIL, PASSWORD } from "../support/signIn";

// The smoke flow of the whole product (PLAN S8.1): sign in, create a CV, add a skill and a project, open the preview.
// It uses the pages for every step; the other specs set data up through the API. The admin runs it; it was the only
// user who could read the project catalog before KAN-156. The CV has this prefix, so `afterEach` removes it.
const PREFIX = "E2E Smoke";
const CV_NAME = `${PREFIX} flow`;

test.describe("smoke flow: sign in, create a CV, add a skill and a project, preview", () => {
  test.afterEach(async ({ context }) => {
    await deleteCvsByName(context, PREFIX);
  });

  test("an admin builds a CV and sees the skill and the project in its preview", async ({
    page,
  }) => {
    // 1. Sign in through the page.
    await page.goto("/sign-in");
    await page.getByLabel("Email", { exact: true }).fill(ADMIN_EMAIL);
    await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/users$/);

    // 2. Create a CV.
    await page.goto("/en/cvs");
    await page.getByRole("button", { name: "CREATE CV" }).click();
    const createDialog = page.getByRole("dialog");
    await createDialog.getByRole("textbox", { name: "Name" }).fill(CV_NAME);
    await createDialog.getByRole("textbox", { name: "Education" }).fill("MSc E2E");
    await createDialog
      .getByRole("textbox", { name: "Description" })
      .fill("Made by the smoke flow.");
    await createDialog.getByRole("button", { name: "Create" }).click();
    await expect(page.getByText("CV created", { exact: true })).toBeVisible();

    // 3. Open the CV: a click on the row opens its preview tab.
    const search = page.getByRole("searchbox", { name: "Search CVs" });
    await search.fill(CV_NAME);
    await search.press("Enter");
    await page.getByRole("cell", { name: CV_NAME, exact: true }).click();
    await expect(page).toHaveURL(/\/en\/cvs\/[^/]+\/preview$/);
    const cvUrl = page.url().replace(/\/preview$/, "");

    // 4. Add a skill. The admin has Communication in the seed (backend/prisma/seed/users.data.ts).
    await page.goto(`${cvUrl}/skills`);
    await expect(page.getByRole("button", { name: "ADD SKILL" })).toBeEnabled();
    await page.getByRole("button", { name: "ADD SKILL" }).click();
    const skillDialog = page.getByRole("dialog", { name: "Add skill" });
    const skillField = skillDialog.getByRole("combobox", { name: "Skill", exact: true });
    await expect(skillField).toBeEnabled();
    await skillField.click();
    await page.getByRole("option", { name: "Communication", exact: true }).click();
    await skillDialog.getByRole("button", { name: "Add", exact: true }).click();
    await expect(page.getByText("Skill added", { exact: true })).toBeVisible();

    // 5. Add a project from the catalog (backend/prisma/seed/projects.data.ts). If the seed changes, update the names here.
    await page.goto(`${cvUrl}/projects`);
    await expect(page.getByRole("button", { name: "ADD PROJECT" })).toBeEnabled();
    await page.getByRole("button", { name: "ADD PROJECT" }).click();
    const projectDialog = page.getByRole("dialog", { name: "Add project" });
    const projectField = projectDialog.getByRole("combobox", { name: "Name" });
    await expect(projectField).toBeEnabled();
    await projectField.click();
    await page.getByRole("option", { name: "Hospital Appointment System", exact: true }).click();
    await projectDialog.getByRole("combobox", { name: "Roles" }).click();
    await page.getByRole("option", { name: "Developer", exact: true }).click();
    // The list of roles stays open after a choice; a click in the next field closes it.
    await projectDialog
      .getByRole("textbox", { name: "Responsibilities" })
      .fill("Built the booking screens.");
    await projectDialog.getByRole("button", { name: "Add", exact: true }).click();
    await expect(page.getByText("Project added", { exact: true })).toBeVisible();

    // 6. The preview shows the CV, the skill and the project.
    await page.goto(`${cvUrl}/preview`);
    const preview = page.getByRole("article", { name: "CV preview" });
    await expect(preview).toBeVisible();
    await expect(preview).toContainText(CV_NAME);
    await expect(preview.getByRole("listitem").filter({ hasText: "Communication" })).toBeVisible();
    await expect(
      preview.getByRole("heading", { name: "Hospital Appointment System" }),
    ).toBeVisible();
  });
});
