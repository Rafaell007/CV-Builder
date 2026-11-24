import { mkdirSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { createCvs, deleteCvsByName } from "../support/cvs";
import { signIn, USER_EMAIL } from "../support/signIn";

// One path through the real app: sign in as a user, open the Projects tab of a new CV, add a project in the modal.
// This file is copied into e2e/zz-run-skill/ by run.sh, so the imports above resolve there, not here.
const OUT = process.env["RUN_OUT"] ?? "test-results/run-skill";
mkdirSync(OUT, { recursive: true });
const PREFIX = "E2E run skill";

test("the Add project modal adds a project to a CV", async ({ page, context }) => {
  await signIn(context, USER_EMAIL);
  const [cvId = ""] = await createCvs(context, PREFIX, 1);
  try {
    await page.goto(`/en/cvs/${cvId}/projects`);
    await page.getByRole("button", { name: "ADD PROJECT" }).click();
    const dialog = page.getByRole("dialog", { name: "Add project" });
    await expect(dialog).toBeVisible();
    const project = dialog.getByRole("combobox", { name: "Name" });
    await expect(project).toBeEnabled();

    await project.click();
    await page.getByRole("option", { name: "Banking Portal", exact: true }).click();
    await dialog.getByRole("combobox", { name: "Roles" }).click();
    await page.getByRole("option", { name: "Developer", exact: true }).click();
    // The next field takes the focus, so the open Roles list closes and the click on Add reaches the button.
    await dialog.getByRole("textbox", { name: "Responsibilities" }).fill("Smoke test.");
    await page.screenshot({ path: `${OUT}/1-modal-filled.png` });

    await dialog.getByRole("button", { name: "Add", exact: true }).click();
    await expect(page.getByText("Project added", { exact: true })).toBeVisible();
    await expect(dialog).toBeHidden();
    await page.screenshot({ path: `${OUT}/2-project-added.png` });
  } finally {
    await deleteCvsByName(context, PREFIX);
  }
});
