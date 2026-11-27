import { expect, test } from "@playwright/test";
import { signIn, USER_EMAIL } from "../support/signIn";
import { seededUserCell } from "../support/users";

// Proves the whole chain: browser → Next.js → NestJS → seeded PostgreSQL.
test("opens the employees page with a healthy backend", async ({ page, context }) => {
  await signIn(context, USER_EMAIL);

  await page.goto("/");

  await expect(page).toHaveURL(/\/users$/);
  await expect(page.getByRole("heading", { name: "Employees" })).toBeVisible();
  await expect(seededUserCell(page)).toBeVisible();
});
