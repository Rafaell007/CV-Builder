import { appendFileSync, mkdirSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { deleteCvsByName } from "../support/cvs";
import { graphql } from "../support/graphql";
import { waitForHydration } from "../support/hydration";
import { ADMIN_EMAIL, signIn, USER_EMAIL } from "../support/signIn";

// KAN-144: an admin creates a CV on the User CVs tab of an employee. The ticket says the Create form sends no
// `userId`, so the CV would belong to the admin. This scenario records who owns the new CV and keeps the screenshots.
// Copied into e2e/zz-run-skill/ by run.sh.
const OUT = process.env["RUN_OUT"] ?? "test-results/run-skill";
mkdirSync(OUT, { recursive: true });
const PREFIX = "E2E run owner";

function record(label: string, data: Record<string, unknown>) {
  appendFileSync(`${OUT}/observations.jsonl`, `${JSON.stringify({ label, ...data })}\n`);
}

test.afterEach(async ({ context }) => {
  await signIn(context, ADMIN_EMAIL);
  await deleteCvsByName(context, PREFIX);
});

test("the owner of a CV that an admin creates on the User CVs tab", async ({ page, context }) => {
  await signIn(context, USER_EMAIL);
  const { me } = await graphql<{ me: { id: string } }>(context, "query { me { id } }", {});
  await signIn(context, ADMIN_EMAIL);

  await page.goto(`/en/users/${me.id}/cvs`);
  await page.getByRole("button", { name: "CREATE CV" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("textbox", { name: "Name" }).fill(`${PREFIX} 1`);
  await dialog.getByRole("textbox", { name: "Education" }).fill("E2E");
  await dialog.getByRole("textbox", { name: "Description" }).fill("Made by a run skill scenario.");
  await dialog.getByRole("button", { name: "Create" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText("CV created", { exact: true })).toBeVisible();

  const tabSearch = page.getByRole("searchbox", { name: "Search CVs" });
  await tabSearch.fill(PREFIX);
  await tabSearch.press("Enter");
  await page.waitForLoadState("networkidle");
  const onTheTab = await page.getByText(`${PREFIX} 1`).count();
  await page.screenshot({ path: `${OUT}/admin-create-user-tab.png` });

  await page.goto("/en/cvs");
  const listSearch = page.getByRole("searchbox", { name: "Search CVs" });
  // The list comes with the server HTML; a key press before React takes it over is lost.
  await waitForHydration(listSearch);
  await listSearch.fill(PREFIX);
  await listSearch.press("Enter");
  const row = page.locator("tbody tr:not([data-row-detail])").filter({ hasText: `${PREFIX} 1` });
  await expect(row).toHaveCount(1);
  const rowText = (await row.innerText()).replace(/\s+/g, " ");
  await page.screenshot({ path: `${OUT}/admin-create-all-cvs.png` });
  record("owner of the CV created on the User CVs tab", {
    shownOnTheTabOfTheEmployee: onTheTab > 0,
    rowOnTheCvsPage: rowText,
    ownerIsTheEmployee: rowText.includes(USER_EMAIL),
    ownerIsTheAdmin: rowText.includes(ADMIN_EMAIL),
  });
});
