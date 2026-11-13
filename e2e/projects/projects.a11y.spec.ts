import { expect, test, type Page } from "@playwright/test";
import { ADMIN_EMAIL, signIn } from "../support/signIn";

// Accessibility checks of the projects page (KAN-134, AC-48 to AC-52): keyboard use, focus return, the two
// themes and the tablet width. These tests never change data (they open modals and cancel), so this file may run
// in parallel with projects.spec.ts, which counts the seeded projects.

const TABLET = { width: 768, height: 1024 };
const WCAG_AA_TEXT = 4.5;
// Tab presses: enough to pass the header, the search field, the sort buttons and one page of 10 row menus.
const TAB_STOPS_ON_PAGE = 40;
// Tab presses inside a modal: more than the number of its controls, so the focus must go round at least once.
const TAB_STOPS_IN_CREATE_MODAL = 12;
const TAB_STOPS_IN_DELETE_MODAL = 6;
// Tolerance, in pixels, for two boxes that are on the same row.
const SAME_ROW_TOLERANCE = 2;

const dialog = (page: Page) => page.getByRole("dialog");
const confirmDialog = (page: Page) => page.getByRole("alertdialog");
const createButton = (page: Page) => page.getByRole("button", { name: "CREATE PROJECT" });
const actionsButton = (page: Page, name: string) =>
  page.getByRole("button", { name: `Actions for ${name}` });
// The same button by its label attribute: while a menu is open Radix hides the rest of the page from the
// accessibility tree, so `getByRole` finds nothing then.
const rowMenuTrigger = (page: Page, name: string) =>
  page.locator(`[aria-label="Actions for ${name}"]`);
// The element that holds the focus, inside one container. Exactly one element must hold it (the focus is trapped).
const focusedIn = (container: ReturnType<typeof dialog>) => container.locator(":focus");

async function openProjectsPage(page: Page) {
  await page.goto("/en/admin/projects");
  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
}

test.describe("projects page, keyboard and focus", () => {
  test.beforeEach(async ({ context, page }) => {
    await signIn(context, ADMIN_EMAIL);
    await openProjectsPage(page);
  });

  test("the search field, CREATE PROJECT, the sort buttons and every row menu can be reached with Tab", async ({
    page,
  }) => {
    const reached = new Set<string>();
    // Tab through the page and write down the accessible name of each element that gets the focus.
    for (let step = 0; step < TAB_STOPS_ON_PAGE; step += 1) {
      await page.keyboard.press("Tab");
      const name = await page.evaluate(() => {
        const element = document.activeElement;
        return element?.getAttribute("aria-label") ?? element?.textContent?.trim() ?? "";
      });
      reached.add(name);
    }

    expect(reached).toContain("Search projects");
    expect(reached).toContain("CREATE PROJECT");
    expect(reached).toContain("Name");
    expect(reached).toContain("Start Date");
    expect(reached).toContain("End Date");
    expect(reached).toContain("Actions for Banking Portal");
  });

  test("a sort button works with Enter and with Space", async ({ page }) => {
    const nameHeader = page.getByRole("columnheader", { name: "Name" });
    const nameButton = page.getByRole("button", { name: "Name", exact: true });

    await nameButton.focus();
    await page.keyboard.press("Enter");
    await expect(nameHeader).toHaveAttribute("aria-sort", "descending");

    await page.keyboard.press("Space");
    await expect(nameHeader).toHaveAttribute("aria-sort", "ascending");
    await expect(nameButton).toBeFocused();
  });

  test("the Create modal takes the focus, keeps it inside and gives it back to CREATE PROJECT on Escape", async ({
    page,
  }) => {
    await createButton(page).focus();
    await page.keyboard.press("Enter");

    await expect(dialog(page)).toBeVisible();
    await expect(focusedIn(dialog(page))).toHaveCount(1);
    // The focus must stay in the modal however many times Tab is pressed (the page behind is not reachable).
    for (let step = 0; step < TAB_STOPS_IN_CREATE_MODAL; step += 1) {
      await page.keyboard.press("Tab");
      await expect(focusedIn(dialog(page))).toHaveCount(1);
    }

    await page.keyboard.press("Escape");

    await expect(dialog(page)).toBeHidden();
    await expect(createButton(page)).toBeFocused();
  });

  test("Cancel in the Create modal gives the focus back to CREATE PROJECT", async ({ page }) => {
    await createButton(page).click();
    await dialog(page).getByRole("button", { name: "Cancel" }).click();

    await expect(dialog(page)).toBeHidden();
    await expect(createButton(page)).toBeFocused();
  });

  test("the row menu opens with Enter, moves with the arrows and gives the focus back on Escape", async ({
    page,
  }) => {
    const button = actionsButton(page, "Banking Portal");
    await button.focus();
    await page.keyboard.press("Enter");

    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Edit" })).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("menuitem", { name: "Delete" })).toBeFocused();

    await page.keyboard.press("Escape");

    await expect(menu).toBeHidden();
    await expect(button).toBeFocused();
  });

  test("only one row menu is open at a time", async ({ page }) => {
    await actionsButton(page, "Banking Portal").click();
    await expect(page.getByRole("menu")).toHaveCount(1);

    // While a menu is open the rest of the page is inert (Radix), so the next row button is found by its label
    // attribute, not by its role. A click on it first closes the open menu.
    await rowMenuTrigger(page, "Travel Booking App").click({ force: true });
    await expect(page.getByRole("menu")).toHaveCount(0);

    await actionsButton(page, "Travel Booking App").click();
    await expect(page.getByRole("menu")).toHaveCount(1);
    await expect(rowMenuTrigger(page, "Travel Booking App")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await expect(rowMenuTrigger(page, "Banking Portal")).toHaveAttribute("aria-expanded", "false");
  });

  test("Edit from the keyboard opens the filled modal, and Escape gives the focus back to the row menu button", async ({
    page,
  }) => {
    const button = actionsButton(page, "Banking Portal");
    await button.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("menuitem", { name: "Edit" })).toBeFocused();
    await page.keyboard.press("Enter");

    await expect(dialog(page)).toBeVisible();
    await expect(dialog(page).getByRole("textbox", { name: "Name" })).toHaveValue("Banking Portal");
    await expect(focusedIn(dialog(page))).toHaveCount(1);

    await page.keyboard.press("Escape");

    await expect(dialog(page)).toBeHidden();
    await expect(button).toBeFocused();
  });

  test("the Delete modal keeps the focus inside, and Escape gives it back to the row menu button", async ({
    page,
  }) => {
    const button = actionsButton(page, "Banking Portal");
    await button.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("menuitem", { name: "Edit" })).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("menuitem", { name: "Delete" })).toBeFocused();
    await page.keyboard.press("Enter");

    await expect(confirmDialog(page)).toBeVisible();
    await expect(focusedIn(confirmDialog(page))).toHaveCount(1);
    for (let step = 0; step < TAB_STOPS_IN_DELETE_MODAL; step += 1) {
      await page.keyboard.press("Tab");
      await expect(focusedIn(confirmDialog(page))).toHaveCount(1);
    }

    await page.keyboard.press("Escape");

    await expect(confirmDialog(page)).toBeHidden();
    // Nothing was deleted: Escape is a Cancel.
    await expect(page.getByRole("row", { name: /Banking Portal/ })).toHaveCount(1);
    await expect(button).toBeFocused();
  });

  test("the date picker opens its calendar from the keyboard and picks a day with Enter", async ({
    page,
  }) => {
    await createButton(page).click();
    const startDate = dialog(page).getByRole("textbox", { name: "Start Date" });
    await startDate.fill("01/10/2026");
    await startDate.focus();

    // The first Arrow Down moves into the calendar, the next ones move by day or week (DatePicker README).
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("dialog", { name: "Choose a date" })).toBeVisible();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Enter");

    await expect(startDate).not.toHaveValue("01/10/2026");
  });

  // Known issue (projects README, "Escape in the calendar"): one Escape closes the calendar AND the Create modal,
  // so the user loses the form. WAI-ARIA wants the popup closed first. Remove `fixme` when the shared Modal and
  // DatePicker agree on who handles the key.
  test.fixme("Escape closes only the calendar, not the Create modal", async ({ page }) => {
    await createButton(page).click();
    const startDate = dialog(page).getByRole("textbox", { name: "Start Date" });
    await startDate.focus();
    await page.keyboard.press("ArrowDown");
    const calendar = page.getByRole("dialog", { name: "Choose a date" });
    await expect(calendar).toBeVisible();

    await page.keyboard.press("Escape");

    await expect(calendar).toBeHidden();
    await expect(dialog(page).getByRole("textbox", { name: "Name" })).toBeVisible();
    await expect(startDate).toBeFocused();
  });
});

// The WCAG 2.x contrast ratio of the text of an element against the colour behind it, measured in the browser.
// A canvas turns any CSS colour (rgb, color-mix, oklch) into plain sRGB numbers.
async function contrastOf(page: Page, selector: string): Promise<number> {
  return page.evaluate((query) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("No canvas context");

    const toRgba = (colour: string): [number, number, number, number] => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = colour;
      context.fillRect(0, 0, 1, 1);
      const [r = 0, g = 0, b = 0, a = 0] = context.getImageData(0, 0, 1, 1).data;
      return [r, g, b, a / 255];
    };
    const luminance = ([r, g, b]: number[]) => {
      const [lr = 0, lg = 0, lb = 0] = [r, g, b].map((value) => {
        const channel = (value ?? 0) / 255;
        return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
    };

    const element = document.querySelector(query);
    if (!element) throw new Error(`Nothing matches ${query}`);

    // The first ancestor with a (nearly) solid background is what the user sees behind the text.
    let background: [number, number, number, number] = [255, 255, 255, 1];
    for (let node: Element | null = element; node; node = node.parentElement) {
      const colour = toRgba(getComputedStyle(node).backgroundColor);
      if (colour[3] > 0.99) {
        background = colour;
        break;
      }
    }
    const text = toRgba(getComputedStyle(element).color);
    const lighter = Math.max(luminance(text), luminance(background));
    const darker = Math.min(luminance(text), luminance(background));
    return (lighter + 0.05) / (darker + 0.05);
  }, selector);
}

for (const theme of ["light", "dark"] as const) {
  test.describe(`projects page, ${theme} theme`, () => {
    test.beforeEach(async ({ baseURL, context, page }) => {
      await signIn(context, ADMIN_EMAIL);
      // The saved choice of the user (PreferencesScript reads this cookie before the first paint).
      await context.addCookies([{ name: "theme", value: theme, url: baseURL ?? "" }]);
      await openProjectsPage(page);
    });

    test("applies the theme and keeps the project rows readable", async ({ page }) => {
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);

      const firstRow = page
        .getByRole("row")
        .filter({ has: page.getByRole("cell") })
        .first();
      await expect(firstRow).toContainText("Banking Portal");
      // The name cell, the domain cell and the heading are the three kinds of text on the list.
      expect(await contrastOf(page, "tbody tr:first-child td:first-child")).toBeGreaterThanOrEqual(
        WCAG_AA_TEXT,
      );
      expect(await contrastOf(page, "tbody tr:first-child td:nth-child(2)")).toBeGreaterThanOrEqual(
        WCAG_AA_TEXT,
      );
      expect(await contrastOf(page, "h1")).toBeGreaterThanOrEqual(WCAG_AA_TEXT);
    });

    test("shows the Create modal in the theme, with readable text", async ({ page }) => {
      await createButton(page).click();

      await expect(dialog(page)).toBeVisible();
      expect(await contrastOf(page, '[role="dialog"] h2')).toBeGreaterThanOrEqual(WCAG_AA_TEXT);
      // The field label uses --color-text-secondary. In the dark theme it was 4.32:1 (KAN-139 fixed it).
      expect(await contrastOf(page, '[role="dialog"] label')).toBeGreaterThanOrEqual(WCAG_AA_TEXT);
    });
  });
}

test.describe("projects page, tablet width", () => {
  test.use({ viewport: TABLET });

  test.beforeEach(async ({ context, page }) => {
    await signIn(context, ADMIN_EMAIL);
    await openProjectsPage(page);
  });

  test("does not scroll sideways and hides the Domain column", async ({ page }) => {
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );

    expect(overflow).toBeLessThanOrEqual(0);
    await expect(page.getByRole("columnheader", { name: "Domain" })).toBeHidden();
    await expect(page.getByRole("columnheader", { name: "Name" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Start Date" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "End Date" })).toBeVisible();
    await expect(createButton(page)).toBeVisible();
    await expect(actionsButton(page, "Banking Portal")).toBeVisible();
  });

  test("the Create modal fits the screen and shows the two date fields side by side", async ({
    page,
  }) => {
    await createButton(page).click();
    await expect(dialog(page)).toBeVisible();

    const modal = await dialog(page).boundingBox();
    const start = await dialog(page).getByRole("textbox", { name: "Start Date" }).boundingBox();
    const end = await dialog(page).getByRole("textbox", { name: "End Date" }).boundingBox();

    expect(modal).not.toBeNull();
    expect(start).not.toBeNull();
    expect(end).not.toBeNull();
    if (!modal || !start || !end) return;
    expect(modal.x).toBeGreaterThanOrEqual(0);
    expect(modal.x + modal.width).toBeLessThanOrEqual(TABLET.width);
    expect(modal.y + modal.height).toBeLessThanOrEqual(TABLET.height);
    // Same row: the tops are equal and the end field is to the right of the start field.
    expect(Math.abs(start.y - end.y)).toBeLessThan(SAME_ROW_TOLERANCE);
    expect(end.x).toBeGreaterThan(start.x + start.width - 1);
  });

  test("the calendar opens inside the screen width", async ({ page }) => {
    await createButton(page).click();
    await dialog(page).getByRole("textbox", { name: "End Date" }).click();

    const calendar = page.getByRole("dialog", { name: "Choose a date" });
    await expect(calendar).toBeVisible();
    const box = await calendar.boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(TABLET.width);
  });

  // Known issue (projects README, "Calendar cut by the modal"): at 768 x 1024 the calendar opens above the field and
  // the top edge of the modal cuts its header, so the month and year buttons and the arrows cannot be used.
  // Remove `fixme` when the shared DatePicker or Modal lets the popup show whole.
  test.fixme("the calendar header is not cut by the modal", async ({ page }) => {
    await createButton(page).click();
    await dialog(page).getByRole("textbox", { name: "End Date" }).click();

    const calendar = page.getByRole("dialog", { name: "Choose a date" });
    await expect(calendar).toBeVisible();
    // toBeInViewport sees a part that an ancestor clips as not visible.
    await expect(calendar.getByRole("button", { name: "Next month" })).toBeInViewport();
  });
});
