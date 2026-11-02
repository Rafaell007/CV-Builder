import { expect, test } from "@playwright/test";

// Proves the whole chain: browser → Next.js → NestJS → seeded PostgreSQL.
test("opens the employees page with a healthy backend", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/users$/);
  await expect(page.getByRole("heading", { name: "Employees" })).toBeVisible();
  await expect(page.getByText("Backend health (server): ok")).toBeVisible();
  await expect(page.getByText("Backend health (client): ok")).toBeVisible();
});
