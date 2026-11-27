import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { createCvs, deleteCvsByName } from "../support/cvs";
import { graphql } from "../support/graphql";
import { createProject, deleteProjectsByName } from "../support/projects";
import { ADMIN_EMAIL, signIn, USER_EMAIL } from "../support/signIn";

// KAN-170: the dates of a CV project in the Add project modal.
// 1. Stale form: the project is narrowed after the modal opened, so the backend rejects the dates with reasons and
//    the modal shows its own translated text (English and Polish). The picker blocks typed dates outside the project,
//    so this is the only way to see these texts in a browser.
// 2. Time zones: the days that the page sends and shows are the same in a zone far east and far west of UTC.
// Copied into e2e/zz-run-skill/ by run.sh.
const OUT = process.env["RUN_OUT"] ?? "test-results/run-skill";
mkdirSync(OUT, { recursive: true });
const PREFIX = "E2E run dates";
const PROJECT = `${PREFIX} Project`;

const TEXTS = {
  en: {
    add: "ADD PROJECT",
    dialog: "Add project",
    name: "Name",
    start: "Start Date",
    end: "End Date",
    roles: "Roles",
    resp: "Responsibilities",
    submit: "Add",
    ok: "Project added",
    startOutside: "Start date must be within project duration",
    endOutside: "End date must be within project duration",
  },
  pl: {
    add: "DODAJ PROJEKT",
    dialog: "Dodaj projekt",
    name: "Nazwa",
    start: "Data rozpoczęcia",
    end: "Data zakończenia",
    roles: "Role",
    resp: "Obowiązki",
    submit: "Dodaj",
    ok: "Dodano projekt",
    startOutside: "Data rozpoczęcia musi mieścić się w czasie trwania projektu",
    endOutside: "Data zakończenia musi mieścić się w czasie trwania projektu",
  },
} as const;
type Lang = keyof typeof TEXTS;

async function openAdd(page: Page, cvId: string, lang: Lang) {
  const t = TEXTS[lang];
  await page.goto(`/${lang}/cvs/${cvId}/projects`);
  await page.getByRole("button", { name: t.add }).click();
  const dialog = page.getByRole("dialog", { name: t.dialog });
  await expect(dialog).toBeVisible();
  const project = dialog.getByRole("combobox", { name: t.name });
  await expect(project).toBeEnabled();
  return { dialog, project, t };
}

async function chooseProjectAndRole(page: Page, name: string, lang: Lang, cvId: string) {
  const { dialog, project, t } = await openAdd(page, cvId, lang);
  await project.click();
  await page.getByRole("option", { name, exact: true }).click();
  await dialog.getByRole("combobox", { name: t.roles }).click();
  await page.getByRole("option", { name: "Developer", exact: true }).click();
  // The next field takes the focus, so the open Roles list closes and the click on Add reaches the button.
  await dialog.getByRole("textbox", { name: t.resp }).fill("Date scenario.");
  return { dialog, t };
}

for (const lang of ["en", "pl"] as const) {
  test.describe(`stale form, ${lang}`, () => {
    let cvId = "";
    let projectId = "";

    test.beforeEach(async ({ context }) => {
      await signIn(context, USER_EMAIL);
      [cvId = ""] = await createCvs(context, PREFIX, 1);
      await signIn(context, ADMIN_EMAIL);
      // A new project that no CV uses: the backend refuses to narrow a project that a CV entry needs. 2024-01-01 to 2024-12-31.
      projectId = await createProject(context, PROJECT);
      await signIn(context, USER_EMAIL);
    });

    test.afterEach(async ({ context }) => {
      await deleteCvsByName(context, PREFIX);
      await signIn(context, ADMIN_EMAIL);
      await deleteProjectsByName(context, PROJECT);
    });

    test("the backend rejects both dates and the modal shows the reasons in the language of the page", async ({
      page,
      browser,
      baseURL,
    }) => {
      const { dialog, t } = await chooseProjectAndRole(page, PROJECT, lang, cvId);

      const admin = await browser.newContext({ baseURL });
      await signIn(admin, ADMIN_EMAIL);
      await graphql(
        admin,
        "mutation U($input: UpdateProjectInput!) { updateProject(input: $input) { id } }",
        {
          input: {
            id: projectId,
            name: PROJECT,
            description: "A project that a scenario created.",
            domain: "E2E",
            environmentIds: [],
            startDate: "2024-03-01T00:00:00.000Z",
            endDate: "2024-06-30T00:00:00.000Z",
          },
        },
      );
      await admin.close();

      await dialog.getByRole("button", { name: t.submit, exact: true }).click();

      await expect(dialog.getByRole("alert")).toHaveText([t.startOutside, t.endOutside]);
      await expect(dialog).toBeVisible();
      await expect(dialog.getByRole("textbox", { name: t.resp })).toHaveValue("Date scenario.");
      await page.screenshot({ path: `${OUT}/dates-stale-${lang}.png` });

      if (lang === "en") {
        await dialog.getByRole("textbox", { name: t.start }).fill("03/01/2024");
        await dialog.getByRole("textbox", { name: t.end }).fill("06/30/2024");
        await dialog.getByRole("button", { name: t.submit, exact: true }).click();
        await expect(page.getByText(t.ok, { exact: true })).toBeVisible();
        await expect(dialog).toBeHidden();
      }
    });
  });
}

for (const timezoneId of ["Pacific/Auckland", "America/Los_Angeles"]) {
  test.describe(`time zone ${timezoneId}`, () => {
    test.use({ timezoneId });

    test.afterEach(async ({ context }) => {
      await deleteCvsByName(context, PREFIX);
    });

    test("the days that the page sends and shows do not move", async ({ page, context }) => {
      await signIn(context, USER_EMAIL);
      const [cvId = ""] = await createCvs(context, PREFIX, 1);
      // Hospital Appointment System (seed) lasts from 2021-03-01 to 2022-02-28. The form fills both dates with these days.
      const { dialog, t } = await chooseProjectAndRole(
        page,
        "Hospital Appointment System",
        "en",
        cvId,
      );
      const sent = page.waitForRequest(
        (request) =>
          request.url().includes("/graphql") && (request.postData() ?? "").includes("AddCvProject"),
      );

      await dialog.getByRole("button", { name: t.submit, exact: true }).click();

      const input = (
        (await sent).postDataJSON() as { variables: { input: Record<string, unknown> } }
      ).variables.input;
      expect(input["startDate"]).toBe("2021-03-01T00:00:00.000Z");
      expect(input["endDate"]).toBe("2022-02-28T00:00:00.000Z");
      await expect(page.getByText(t.ok, { exact: true })).toBeVisible();
      const row = page
        .locator("tbody tr:not([data-row-detail])")
        .filter({ hasText: "Hospital Appointment System" });
      await expect(row).toContainText("03/01/2021");
      await expect(row).toContainText("02/28/2022");
      await page.getByRole("button", { name: "Actions for Hospital Appointment System" }).click();
      await page.getByRole("menuitem", { name: "Update" }).click();
      const update = page.getByRole("dialog", { name: "Update project" });
      await expect(update.getByRole("textbox", { name: t.start })).toHaveValue("03/01/2021");
      await expect(update.getByRole("textbox", { name: t.end })).toHaveValue("02/28/2022");
      await page.screenshot({ path: `${OUT}/dates-${timezoneId.replace("/", "-")}.png` });
    });
  });
}
