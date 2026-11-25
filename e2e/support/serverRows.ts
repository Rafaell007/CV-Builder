import type { Page } from "@playwright/test";

/**
 * The table rows of a page as the server sent them (PLAN D6). Use it in a `describe` with
 * `test.use({ javaScriptEnabled: false })`, so no client code runs. React streams the part of the page that needs the
 * user's data after the static shell, into a hidden element that a small inline script would reveal. These rows are
 * therefore in the document but not visible, so the locator uses CSS and not roles (roles skip hidden elements).
 * The detail line under a row (a description) is a row of its own; the table marks it with data-row-detail.
 */
export const serverRows = (page: Page) => page.locator("tbody tr:has(td):not([data-row-detail])");
