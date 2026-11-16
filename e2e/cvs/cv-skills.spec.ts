import { expect, test, type Page } from "@playwright/test";
import { createCvs, deleteCvsByName } from "../support/cvs";
import { addCvSkillsByName } from "../support/cvSkills";
import { ADMIN_EMAIL, signIn, USER_EMAIL } from "../support/signIn";

// Every CV that a test makes has this prefix, so `afterEach` can remove it, also after a test failed halfway.
// A CV takes its skills with it, so there is nothing else to clean up.
const PREFIX = "E2E Skills";

// Seed (backend/prisma/seed/users.data.ts): user1 has TypeScript (Advanced), JavaScript (Expert) and React (Expert),
// among others, and no Python. The admin has Communication, and no TypeScript.
const skill = (page: Page, name: string, level?: string) =>
  page.getByRole("button", { name: level ? `${name} Mastery: ${level}` : new RegExp(`^${name}`) });
const addDialog = (page: Page) => page.getByRole("dialog", { name: "Add skill" });
const updateDialog = (page: Page) => page.getByRole("dialog", { name: "Update skill" });
// Exact: the modal also has an optional "Skill mastery" field, which /Skill/ matched as well.
const skillField = (page: Page) =>
  addDialog(page).getByRole("combobox", { name: "Skill", exact: true });

async function openAddModal(page: Page) {
  await page.getByRole("button", { name: "ADD SKILL" }).click();
  await expect(addDialog(page)).toBeVisible();
  // The options load from the backend; the field is disabled until they are here.
  await expect(skillField(page)).toBeEnabled();
}

async function chooseSkill(page: Page, name: string) {
  await skillField(page).click();
  await page.getByRole("option", { name, exact: true }).click();
}

test.describe("CV Skills page, as a user", () => {
  let cvId: string;
  const name = `${PREFIX} user`;

  test.beforeEach(async ({ context, page }) => {
    await signIn(context, USER_EMAIL);
    [cvId = ""] = await createCvs(context, name, 1);
    await page.goto(`/en/cvs/${cvId}/skills`);
    await expect(page.getByRole("button", { name: "ADD SKILL" })).toBeEnabled();
  });

  test.afterEach(async ({ context }) => {
    await deleteCvsByName(context, PREFIX);
  });

  test("shows the Skills tab as active, the breadcrumbs and the empty state", async ({ page }) => {
    await expect(
      page.getByRole("navigation", { name: "CV sections" }).getByRole("link", { name: "Skills" }),
    ).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("navigation", { name: "Breadcrumbs" })).toContainText(`${name} 1`);
    await expect(page.getByText("No skills added yet")).toBeVisible();
    await expect(page.getByRole("button", { name: "REMOVE SKILLS" })).toBeDisabled();
  });

  test("the Add skill modal offers only skills of the owner, and ADD waits for a choice", async ({
    page,
  }) => {
    await openAddModal(page);
    await expect(addDialog(page).getByRole("button", { name: "Add", exact: true })).toBeDisabled();

    await skillField(page).click();

    await expect(page.getByRole("option", { name: "TypeScript", exact: true })).toBeVisible();
    await expect(page.getByRole("option", { name: "React", exact: true })).toBeVisible();
    // The seed gives user1 no Python and no soft skills: the catalog has them, the owner does not.
    await expect(page.getByRole("option", { name: "Python", exact: true })).toBeHidden();
    await expect(page.getByRole("option", { name: "Communication", exact: true })).toBeHidden();
  });

  test("adds skills, groups them by category and keeps them after a reload", async ({ page }) => {
    await openAddModal(page);
    await chooseSkill(page, "TypeScript");
    await addDialog(page).getByRole("button", { name: "Add", exact: true }).click();

    await expect(page.getByText("Skill added", { exact: true })).toBeVisible();
    await expect(addDialog(page)).toBeHidden();
    const languages = page.getByRole("region", { name: "Programming Languages" });
    await expect(
      languages.getByRole("button", { name: "TypeScript Mastery: Advanced" }),
    ).toBeVisible();

    await openAddModal(page);
    await chooseSkill(page, "React");
    await addDialog(page).getByRole("button", { name: "Add", exact: true }).click();
    await expect(
      page.getByRole("region", { name: "Frontend" }).getByRole("button", { name: /^React/ }),
    ).toBeVisible();

    await page.reload();
    await expect(page.getByRole("region", { name: "Programming Languages" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Frontend" })).toBeVisible();
    // A skill that the CV holds is not offered again.
    await openAddModal(page);
    await skillField(page).click();
    await expect(page.getByRole("option", { name: "TypeScript", exact: true })).toBeHidden();
    await expect(page.getByRole("option", { name: "JavaScript", exact: true })).toBeVisible();
  });

  test("changes the mastery of a skill in this CV, and keeps the change after a reload", async ({
    context,
    page,
  }) => {
    await addCvSkillsByName(context, cvId, ["TypeScript"]);
    await page.reload();

    await skill(page, "TypeScript", "Advanced").click();

    await expect(updateDialog(page)).toBeVisible();
    // The skill itself cannot change.
    await expect(updateDialog(page).getByRole("combobox", { name: /Skill/ })).toBeDisabled();
    const save = updateDialog(page).getByRole("button", { name: "Save" });
    await expect(save).toBeDisabled();
    await updateDialog(page)
      .getByRole("combobox", { name: /Mastery/ })
      .click();
    await page.getByRole("option", { name: "Expert", exact: true }).click();
    await save.click();

    await expect(page.getByText("Skill updated", { exact: true })).toBeVisible();
    await expect(skill(page, "TypeScript", "Expert")).toBeVisible();
    await page.reload();
    await expect(skill(page, "TypeScript", "Expert")).toBeVisible();
  });

  test("removes the chosen skills after a confirmation, and a cancel removes nothing", async ({
    context,
    page,
  }) => {
    await addCvSkillsByName(context, cvId, ["TypeScript", "JavaScript", "React"]);
    await page.reload();

    await page.getByRole("button", { name: "REMOVE SKILLS" }).click();
    await expect(page.getByRole("button", { name: "Remove", exact: true })).toBeDisabled();
    await skill(page, "TypeScript").click();
    await skill(page, "JavaScript").click();
    await expect(skill(page, "TypeScript")).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Remove 2" }).click();
    const confirm = page.getByRole("alertdialog", { name: "Remove skills" });
    await expect(confirm).toContainText("Are you sure you want to remove 2 skills?");

    await confirm.getByRole("button", { name: "Cancel" }).click();
    await expect(confirm).toBeHidden();
    await expect(skill(page, "TypeScript")).toBeVisible();

    await page.getByRole("button", { name: "Remove 2" }).click();
    await confirm.getByRole("button", { name: "Confirm" }).click();

    await expect(confirm).toBeHidden();
    await expect(skill(page, "TypeScript")).toBeHidden();
    await expect(skill(page, "JavaScript")).toBeHidden();
    await expect(skill(page, "React")).toBeVisible();
    // The mode ended with the removal.
    await expect(page.getByRole("button", { name: "ADD SKILL" })).toBeVisible();
    await page.reload();
    await expect(skill(page, "TypeScript")).toBeHidden();
    await expect(skill(page, "React")).toBeVisible();
    // The skills of the owner stay: the removed ones can be added again.
    await openAddModal(page);
    await skillField(page).click();
    await expect(page.getByRole("option", { name: "TypeScript", exact: true })).toBeVisible();
  });

  test("Escape leaves the selection mode and clears the choice", async ({ context, page }) => {
    await addCvSkillsByName(context, cvId, ["TypeScript"]);
    await page.reload();
    await page.getByRole("button", { name: "REMOVE SKILLS" }).click();
    await skill(page, "TypeScript").click();

    await page.keyboard.press("Escape");

    await expect(page.getByRole("button", { name: "ADD SKILL" })).toBeVisible();
    await page.getByRole("button", { name: "REMOVE SKILLS" }).click();
    await expect(page.getByRole("button", { name: "Remove", exact: true })).toBeDisabled();
  });
});

test.describe("CV Skills page, as an admin", () => {
  test("an admin adds skills that the OWNER has, not skills of the admin", async ({
    browser,
    context,
    page,
  }) => {
    const ownerContext = await browser.newContext();
    await signIn(ownerContext, USER_EMAIL);
    const [cvId = ""] = await createCvs(ownerContext, `${PREFIX} owner`, 1);
    try {
      await signIn(context, ADMIN_EMAIL);
      await page.goto(`/en/cvs/${cvId}/skills`);
      await expect(page.getByRole("button", { name: "ADD SKILL" })).toBeEnabled();

      await openAddModal(page);
      await skillField(page).click();

      await expect(page.getByRole("option", { name: "TypeScript", exact: true })).toBeVisible();
      await expect(page.getByRole("option", { name: "Communication", exact: true })).toBeHidden();
      await page.getByRole("option", { name: "TypeScript", exact: true }).click();
      await addDialog(page).getByRole("button", { name: "Add", exact: true }).click();
      await expect(skill(page, "TypeScript", "Advanced")).toBeVisible();
    } finally {
      await deleteCvsByName(ownerContext, PREFIX);
      await ownerContext.close();
    }
  });

  test("a user cannot open the skills of the CV of another user", async ({
    browser,
    context,
    page,
  }) => {
    const adminContext = await browser.newContext();
    await signIn(adminContext, ADMIN_EMAIL);
    const [adminCvId = ""] = await createCvs(adminContext, `${PREFIX} admin`, 1);
    try {
      await signIn(context, USER_EMAIL);
      await page.goto(`/en/cvs/${adminCvId}/skills`);

      await expect(page.getByRole("alert").filter({ hasText: "CV not found" })).toBeVisible();
      await expect(page.getByRole("button", { name: "ADD SKILL" })).toBeHidden();
    } finally {
      await deleteCvsByName(adminContext, PREFIX);
      await adminContext.close();
    }
  });
});
