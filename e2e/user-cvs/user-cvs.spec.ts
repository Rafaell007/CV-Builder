import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { createCvs, deleteCvsByName } from "../support/cvs";
import { graphql } from "../support/graphql";
import { ADMIN_EMAIL, signIn, USER_EMAIL } from "../support/signIn";

// Every CV that a test makes has this prefix, so `afterEach` can remove it, also after a test failed halfway.
const PREFIX = "E2E UserCvs";

const dialog = (page: Page) => page.getByRole("dialog");
// The delete modal is a ConfirmModal, which Radix marks as an alertdialog.
const confirmDialog = (page: Page) => page.getByRole("alertdialog");
const tabs = (page: Page) => page.getByRole("navigation", { name: "Employee sections" });
const search = (page: Page) => page.getByRole("searchbox", { name: "Search CVs" });
const rows = (page: Page) =>
  page.locator("tbody tr:not([data-row-detail])").filter({ has: page.getByRole("cell") });

/** The id of the user that the context is signed in as. The tab page is `/users/{id}/cvs`. */
async function currentUserId(context: BrowserContext): Promise<string> {
  const data = await graphql<{ me: { id: string } }>(context, "query { me { id } }", {});
  return data.me.id;
}

test.describe("User CVs tab, as an admin", () => {
  let userId: string;
  let adminId: string;
  let userCvId: string;

  test.beforeEach(async ({ context, page }) => {
    // The CVs of user1 are the CVs of the tab. The session of user1 makes one, the admin makes one of their own.
    await signIn(context, USER_EMAIL);
    userId = await currentUserId(context);
    [userCvId = ""] = await createCvs(context, `${PREFIX} user1`, 1);
    await signIn(context, ADMIN_EMAIL);
    adminId = await currentUserId(context);
    await createCvs(context, `${PREFIX} admin`, 1);

    await page.goto(`/en/users/${userId}/cvs`);
    await search(page).fill(PREFIX);
    await expect(page.getByText(`${PREFIX} user1 1`)).toBeVisible();
  });

  test.afterEach(async ({ context }) => {
    // An admin finds the CVs of every user by name.
    await signIn(context, ADMIN_EMAIL);
    await deleteCvsByName(context, PREFIX);
  });

  test("shows the four tabs, marks CVs and shows only the CVs of that user", async ({ page }) => {
    await expect(tabs(page).getByRole("link")).toHaveText([
      "Profile",
      "Skills",
      "Languages",
      "CVs",
    ]);
    await expect(tabs(page).getByRole("link", { name: "CVs" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(page.getByRole("navigation", { name: "Breadcrumbs" })).toContainText("Employees");

    // The admin's own CV has the same prefix, and it is not in the list of user1.
    await expect(rows(page)).toHaveCount(1);
    await expect(rows(page).first()).toContainText(USER_EMAIL);
    await expect(page.getByText(`${PREFIX} admin 1`)).toHaveCount(0);
  });

  test("CREATE CV makes the CV for this user, after the backend confirmed it", async ({ page }) => {
    const name = `${PREFIX} created`;

    await page.getByRole("button", { name: "CREATE CV" }).click();
    await dialog(page).getByRole("textbox", { name: "Name" }).fill(name);
    await dialog(page).getByRole("textbox", { name: "Education" }).fill("BSc E2E");
    await dialog(page).getByRole("textbox", { name: "Description" }).fill("Made by an E2E test.");
    await dialog(page).getByRole("button", { name: "Create" }).click();

    await expect(dialog(page)).toBeHidden();
    await expect(rows(page)).toHaveCount(2);
    await expect(rows(page).filter({ hasText: name })).toContainText(USER_EMAIL);
    // The tab stays on this user after the list loaded again.
    await expect(page).toHaveURL(new RegExp(`/users/${userId}/cvs$`));
  });

  test("Edit saves the new name, Delete asks first and Confirm removes the CV", async ({
    page,
  }) => {
    const renamed = `${PREFIX} renamed`;

    await page.getByRole("button", { name: `Actions for ${PREFIX} user1 1` }).click();
    await page.getByRole("menuitem", { name: "Edit" }).click();
    await dialog(page).getByRole("textbox", { name: "Name" }).fill(renamed);
    await dialog(page).getByRole("button", { name: "Save" }).click();
    await expect(dialog(page)).toBeHidden();
    await expect(page.getByText(renamed, { exact: true })).toBeVisible();

    await page.getByRole("button", { name: `Actions for ${renamed}` }).click();
    await page.getByRole("menuitem", { name: "Delete" }).click();
    await confirmDialog(page).getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByText(renamed, { exact: true })).toBeVisible();

    await page.getByRole("button", { name: `Actions for ${renamed}` }).click();
    await page.getByRole("menuitem", { name: "Delete" }).click();
    await confirmDialog(page).getByRole("button", { name: "Confirm" }).click();
    await expect(page.getByText(renamed, { exact: true })).toHaveCount(0);
  });

  test("the server rejects Edit and Delete of a CV of another employee than the tab's", async ({
    context,
    page,
  }) => {
    // The page sends the employee of the tab. A request with another employee (here the admin) must fail,
    // even for an admin, and must change nothing.
    const update = `mutation ($input: UpdateCvInput!) { updateCv(input: $input) { id } }`;
    const remove = `mutation ($id: ID!, $userId: ID) { deleteCv(id: $id, userId: $userId) { id } }`;
    const input = {
      id: userCvId,
      userId: adminId,
      name: "Must not be saved",
      education: "E",
      description: "D",
    };

    await expect(graphql(context, update, { input })).rejects.toThrow("CV not found");
    await expect(graphql(context, remove, { id: userCvId, userId: adminId })).rejects.toThrow(
      "CV not found",
    );

    await page.reload();
    await search(page).fill(PREFIX);
    await expect(page.getByText(`${PREFIX} user1 1`)).toBeVisible();
    await expect(page.getByText("Must not be saved")).toHaveCount(0);
  });

  test("View opens the CV Preview page of the CV", async ({ page }) => {
    await page.getByRole("button", { name: `Actions for ${PREFIX} user1 1` }).click();
    await page.getByRole("menuitem", { name: "View" }).click();

    await expect(page).toHaveURL(/\/cvs\/[^/]+\/preview$/);
  });
});

test.describe("User CVs tab, as a user who is not an admin", () => {
  test("has no CVs tab, and a direct link is sent back to Employees by the route rules", async ({
    context,
    page,
  }) => {
    await signIn(context, USER_EMAIL);
    const userId = await currentUserId(context);

    await page.goto(`/en/users/${userId}/profile`);
    await expect(tabs(page).getByRole("link", { name: "Profile" })).toBeVisible();
    await expect(tabs(page).getByRole("link", { name: "CVs" })).toHaveCount(0);

    await page.goto(`/en/users/${userId}/cvs`);
    // The proxy treats /users/{id}/cvs as admin-only (session.utils.ts), so the page itself is never reached.
    await expect(page).toHaveURL(/\/en\/users$/);
    await expect(page.getByRole("button", { name: "CREATE CV" })).toHaveCount(0);
  });
});
