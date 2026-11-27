import { expect, test, type Page } from "@playwright/test";
import { createCvs, deleteCvsByName } from "../support/cvs";
import { signIn, USER_EMAIL } from "../support/signIn";

// Every CV that a test makes has this prefix, so `afterEach` can remove it, also after a test failed halfway.
const PREFIX = "E2E Export";

const exportButton = (page: Page) => page.getByRole("button", { name: "EXPORT PDF" });

test.describe("CV Preview page, EXPORT PDF", () => {
  let cvId: string;
  const name = `${PREFIX} user`;

  test.beforeEach(async ({ context, page }) => {
    await signIn(context, USER_EMAIL);
    [cvId = ""] = await createCvs(context, name, 1);
    await page.goto(`/en/cvs/${cvId}/preview`);
    await expect(page.getByRole("article", { name: "CV preview" })).toBeVisible();
  });

  test.afterEach(async ({ context }) => {
    await deleteCvsByName(context, PREFIX);
  });

  test("downloads a PDF file with the CV name in the file name, and stays on the page (AC-20, AC-22)", async ({
    page,
  }) => {
    const download = page.waitForEvent("download");

    await exportButton(page).click();

    const file = await download;
    // The backend makes the file name from the CV name: lower case, words joined with hyphens.
    expect(file.suggestedFilename()).toBe("e2e-export-user-1.pdf");
    await expect(page).toHaveURL(new RegExp(`/en/cvs/${cvId}/preview$`));
    await expect(page.getByRole("article", { name: "CV preview" })).toBeVisible();
    await expect(exportButton(page)).toBeEnabled();
  });

  test("on the Polish page the button is Polish and the PDF downloads too", async ({ page }) => {
    await page.goto(`/pl/cvs/${cvId}/preview`);
    const download = page.waitForEvent("download");

    await page.getByRole("button", { name: "EKSPORTUJ PDF" }).click();

    // The file name does not depend on the language.
    expect((await download).suggestedFilename()).toBe("e2e-export-user-1.pdf");
  });

  test("shows an error and keeps the preview when the PDF cannot be made (AC-47)", async ({
    page,
  }) => {
    // The failure is made in the browser, so the test needs no broken backend.
    await page.route("**/graphql", async (route) => {
      const body = route.request().postData() ?? "";
      if (body.includes("exportCvPdf")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: null,
            errors: [
              {
                message: "The PDF could not be generated",
                extensions: { code: "INTERNAL_SERVER_ERROR" },
              },
            ],
          }),
        });
        return;
      }
      await route.continue();
    });

    await exportButton(page).click();

    await expect(page.getByText("Could not export the PDF", { exact: true })).toBeVisible();
    await expect(page.getByRole("article", { name: "CV preview" })).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/en/cvs/${cvId}/preview$`));
  });
});
