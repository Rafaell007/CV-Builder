import { appendFileSync, mkdirSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { createCvs, deleteCvsByName } from "../support/cvs";
import { waitForHydration } from "../support/hydration";
import { ADMIN_EMAIL, signIn, USER_EMAIL } from "../support/signIn";

// KAN-147 and KAN-146: who can open the CV Details page, how a user gets there, and how they get back.
// Copied into e2e/zz-run-skill/ by run.sh. It records what the page shows in $RUN_OUT/observations.jsonl.
const OUT = process.env["RUN_OUT"] ?? "test-results/run-skill";
mkdirSync(OUT, { recursive: true });
const PREFIX = "E2E run access";

function record(label: string, data: Record<string, unknown>) {
  appendFileSync(`${OUT}/observations.jsonl`, `${JSON.stringify({ label, ...data })}\n`);
}

test.afterEach(async ({ context }) => {
  await signIn(context, ADMIN_EMAIL);
  await deleteCvsByName(context, PREFIX);
});

test("an employee reaches the Details page of their CV from the list and goes back with the breadcrumb", async ({
  page,
  context,
}) => {
  await signIn(context, USER_EMAIL);
  const [cvId = ""] = await createCvs(context, PREFIX, 1);
  const name = `${PREFIX} 1`;
  await page.goto("/en/cvs");
  const search = page.getByRole("searchbox", { name: "Search CVs" });
  // The list comes with the server HTML; a key press before React takes it over is lost.
  await waitForHydration(search);
  await search.fill(name);
  await search.press("Enter");
  const row = page.locator("tbody tr:not([data-row-detail])").filter({ hasText: name });
  await expect(row).toHaveCount(1);

  await row.getByRole("cell").first().click();
  await page.waitForURL(/\/en\/cvs\/[^/]+\/[a-z]+$/);
  record("row click", { url: page.url(), cvId });

  await page.goBack();
  await page.getByRole("button", { name: `Actions for ${name}` }).click();
  await page.getByRole("menuitem", { name: "View" }).click();
  await page.waitForURL(/\/en\/cvs\/[^/]+\/[a-z]+$/);
  record("View in the row menu", { url: page.url() });

  await page.goto(`/en/cvs/${cvId}/details`);
  await expect(page.getByRole("textbox", { name: "Name" })).toHaveValue(name);
  await page.screenshot({ path: `${OUT}/details-employee.png` });
  await page
    .getByRole("navigation", { name: "Breadcrumbs" })
    .getByRole("link", { name: "CVs" })
    .click();
  await expect(page).toHaveURL(/\/en\/cvs$/);
});

test("an employee gets a not found page for the CV of another user, an admin opens it", async ({
  page,
  context,
}) => {
  await signIn(context, USER_EMAIL);
  const [userCvId = ""] = await createCvs(context, `${PREFIX} user`, 1);
  await signIn(context, ADMIN_EMAIL);
  const [adminCvId = ""] = await createCvs(context, `${PREFIX} admin`, 1);

  await signIn(context, USER_EMAIL);
  await page.goto(`/en/cvs/${adminCvId}/details`);
  await page.waitForLoadState("networkidle");
  record("employee opens the CV of the admin", {
    url: page.url(),
    text: (await page.locator("main").innerText()).replace(/\s+/g, " ").slice(0, 200),
  });
  await page.screenshot({ path: `${OUT}/details-other-user-employee.png` });
  await expect.soft(page.getByText(/not found/i).first()).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Name" })).toBeHidden();

  await signIn(context, ADMIN_EMAIL);
  await page.goto(`/en/cvs/${userCvId}/details`);
  await expect(page.getByRole("textbox", { name: "Name" })).toHaveValue(`${PREFIX} user 1`);
  await page.screenshot({ path: `${OUT}/details-admin-other-user.png` });
});
