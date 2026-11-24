import { appendFileSync, mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { createCvs, deleteCvsByName } from "../support/cvs";
import { ADMIN_EMAIL, signIn } from "../support/signIn";

// KAN-145: the CVs page at desktop and tablet width, in both themes, with the row menu and the three modals open.
// It saves the screenshots for a person to compare with Figma. It records the focus after each modal closes.
// Copied into e2e/zz-run-skill/ by run.sh.
const OUT = process.env["RUN_OUT"] ?? "test-results/run-skill";
mkdirSync(OUT, { recursive: true });
const PREFIX = "E2E run visual";
const SIZES = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 768, height: 1024 },
};

function record(label: string, data: Record<string, unknown>) {
  appendFileSync(`${OUT}/observations.jsonl`, `${JSON.stringify({ label, ...data })}\n`);
}

// Focus returns to the trigger after the close animation, so read it after a short wait. Without the wait the
// first reads showed the page body for a modal that did return its focus.
const focusedName = async (page: Page) => {
  await page.waitForTimeout(600);
  return page.evaluate(() => {
    const element = document.activeElement;
    if (!element || element === document.body) return "body (focus lost)";
    return element.getAttribute("aria-label") ?? element.textContent?.trim().slice(0, 40) ?? "none";
  });
};

for (const [sizeName, viewport] of Object.entries(SIZES)) {
  for (const theme of ["light", "dark"] as const) {
    test.describe(`CVs page, ${sizeName}, ${theme}`, () => {
      test.use({ viewport });

      test("page, row menu and the three modals", async ({ page, context, baseURL }) => {
        const tag = `${sizeName}-${theme}`;
        await signIn(context, ADMIN_EMAIL);
        await context.addCookies([{ name: "theme", value: theme, url: baseURL ?? "" }]);
        const name = `${PREFIX} ${tag}`;
        // A long description shows the cut after three lines at tablet width.
        await createCvs(context, name, 1);
        await page.goto("/en/cvs");
        const search = page.getByRole("searchbox", { name: "Search CVs" });
        await search.fill(name);
        await search.press("Enter");
        await expect(page.getByText(`${name} 1`)).toBeVisible();
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await page.screenshot({ path: `${OUT}/cvs-${tag}-page.png` });

        const menuButton = page.getByRole("button", { name: `Actions for ${name} 1` });
        await menuButton.click();
        await page.screenshot({ path: `${OUT}/cvs-${tag}-menu.png` });
        await page.keyboard.press("Escape");
        record(`${tag} focus after the row menu closes`, { focused: await focusedName(page) });

        await page.getByRole("button", { name: "CREATE CV" }).click();
        await expect(page.getByRole("dialog")).toBeVisible();
        await page.screenshot({ path: `${OUT}/cvs-${tag}-create.png` });
        await page.keyboard.press("Escape");
        await expect(page.getByRole("dialog")).toBeHidden();
        record(`${tag} focus after the Create modal closes`, { focused: await focusedName(page) });

        await menuButton.click();
        await page.getByRole("menuitem", { name: "Edit" }).click();
        await expect(page.getByRole("dialog")).toBeVisible();
        await page.screenshot({ path: `${OUT}/cvs-${tag}-update.png` });
        await page.keyboard.press("Escape");
        await expect(page.getByRole("dialog")).toBeHidden();
        record(`${tag} focus after the Update modal closes`, { focused: await focusedName(page) });

        await menuButton.click();
        await page.getByRole("menuitem", { name: "Delete" }).click();
        await expect(page.getByRole("alertdialog")).toBeVisible();
        await page.screenshot({ path: `${OUT}/cvs-${tag}-delete.png` });
        await page.keyboard.press("Escape");
        await expect(page.getByRole("alertdialog")).toBeHidden();
        record(`${tag} focus after the Delete modal closes`, { focused: await focusedName(page) });
      });

      test.afterEach(async ({ context }) => {
        await signIn(context, ADMIN_EMAIL);
        await deleteCvsByName(context, PREFIX);
      });
    });
  }
}
