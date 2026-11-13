import { expect, test, type Page } from "@playwright/test";
import { createCvs, deleteCvsByName } from "../support/cvs";
import { ADMIN_EMAIL, signIn, USER_EMAIL } from "../support/signIn";

// Every CV that a test makes has this prefix, so `afterEach` can remove it, also after a test failed halfway.
const PREFIX = "E2E Details";

const field = (page: Page, name: string) => page.getByRole("textbox", { name });
const update = (page: Page) => page.getByRole("button", { name: "UPDATE" });
const breadcrumbs = (page: Page) => page.getByRole("navigation", { name: "Breadcrumbs" });
const tabs = (page: Page) => page.getByRole("navigation", { name: "CV sections" });

test.describe("CV Details page, as a user", () => {
  let cvId: string;
  const name = `${PREFIX} user`;

  test.beforeEach(async ({ context, page }) => {
    await signIn(context, USER_EMAIL);
    [cvId = ""] = await createCvs(context, name, 1);
    await page.goto(`/en/cvs/${cvId}/details`);
    await expect(field(page, "Name")).toHaveValue(`${name} 1`);
  });

  test.afterEach(async ({ context }) => {
    await deleteCvsByName(context, PREFIX);
  });

  test("shows the breadcrumbs, the four tabs and the fields of the CV", async ({ page }) => {
    await expect(breadcrumbs(page).getByRole("link", { name: "CVs" })).toHaveAttribute(
      "href",
      "/en/cvs",
    );
    await expect(breadcrumbs(page)).toContainText(`${name} 1`);
    await expect(tabs(page).getByRole("link")).toHaveText([
      "Details",
      "Skills",
      "Projects",
      "Preview",
    ]);
    await expect(tabs(page).getByRole("link", { name: "Details" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(field(page, "Education")).toHaveValue("E2E");
  });

  test("UPDATE is disabled until a change, saves the change and keeps it after a reload", async ({
    page,
  }) => {
    const renamed = `${name} renamed`;
    await expect(update(page)).toBeDisabled();

    await field(page, "Name").fill(renamed);
    await expect(update(page)).toBeEnabled();
    await update(page).click();

    await expect(page.getByText("CV updated", { exact: true })).toBeVisible();
    await expect(update(page)).toBeDisabled();
    await page.reload();
    await expect(field(page, "Name")).toHaveValue(renamed);
    await expect(breadcrumbs(page)).toContainText(renamed);
  });

  test("an empty required field shows its message and keeps UPDATE disabled", async ({ page }) => {
    await field(page, "Education").fill("");
    await field(page, "Name").focus();

    await expect(page.getByText("Education is required")).toBeVisible();
    await expect(update(page)).toBeDisabled();
  });

  test("a click on a tab opens its route, and a reload keeps it", async ({ page }) => {
    await tabs(page).getByRole("link", { name: "Skills" }).click();

    await expect(page).toHaveURL(new RegExp(`/en/cvs/${cvId}/skills$`));
    await expect(tabs(page).getByRole("link", { name: "Skills" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await page.reload();
    await expect(tabs(page).getByRole("link", { name: "Skills" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});

test.describe("CV Details page, access", () => {
  test("a user who opens the CV of another user sees CV not found, on every tab", async ({
    browser,
    page,
    context,
  }) => {
    const adminContext = await browser.newContext();
    await signIn(adminContext, ADMIN_EMAIL);
    const [adminCvId = ""] = await createCvs(adminContext, `${PREFIX} admin`, 1);
    try {
      await signIn(context, USER_EMAIL);

      for (const tab of ["details", "skills"]) {
        await page.goto(`/en/cvs/${adminCvId}/${tab}`);
        await expect(page.getByRole("alert").filter({ hasText: "CV not found" })).toBeVisible();
        await expect(tabs(page)).toBeHidden();
        await expect(page.getByText(`${PREFIX} admin 1`)).toBeHidden();
      }
    } finally {
      await deleteCvsByName(adminContext, PREFIX);
      await adminContext.close();
    }
  });

  test("an admin opens the CV of a user from the list", async ({ context, page }) => {
    await signIn(context, ADMIN_EMAIL);
    await page.goto("/en/cvs");

    await page.getByRole("button", { name: "Name" }).waitFor();
    await page.getByRole("cell", { name: "Frontend Developer", exact: true }).click();

    await expect(page).toHaveURL(/\/en\/cvs\/[^/]+\/details$/);
    await expect(field(page, "Name")).toHaveValue("Frontend Developer");
    await expect(update(page)).toBeDisabled();
  });
});
