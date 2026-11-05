import { expect, test } from "@playwright/test";
import { readMaxPageCopies, startCountingPageCopies } from "../support/pageCopies";
import { signIn, USER_EMAIL } from "../support/signIn";

// Regression test (KAN-81): the toast provider once wrapped the page, so React rendered the page in the browser
// while the server HTML was still streaming in. For about 300 ms the DOM held two copies of the page (a hidden
// `div#S:n` and the live `main`), and any `getByText` or `getByLabel` right after `goto` found 2 elements.
// Unit and Storybook tests cannot see this: it needs a real server, streaming and a browser.
test("the page is never in the DOM twice while it loads, and the toast area exists", async ({
  page,
  context,
}) => {
  await signIn(context, USER_EMAIL);
  await startCountingPageCopies(page);

  await page.goto("/users");
  await expect(page.getByRole("heading", { name: "Employees" })).toBeVisible();

  expect(await readMaxPageCopies(page)).toBe(1);
  await expect(page.getByRole("region", { name: "Notifications (F8)" })).toHaveCount(1);
});
