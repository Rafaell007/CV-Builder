import { mkdirSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { PASSWORD, USER_EMAIL } from "../support/signIn";

// Sign in through the page (not the API), see the Polish version of a page, and log out.
// Copied into e2e/zz-run-skill/ by run.sh.
const OUT = process.env["RUN_OUT"] ?? "test-results/run-skill";
mkdirSync(OUT, { recursive: true });

test("sign in, open the page in Polish, log out and be sent to sign in", async ({
  page,
  context,
}) => {
  await page.goto("/sign-in");
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await page.screenshot({ path: `${OUT}/auth-1-sign-in.png` });

  await page.getByLabel("Email", { exact: true }).fill(USER_EMAIL);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/users$/);
  await page.screenshot({ path: `${OUT}/auth-2-employees.png` });

  await page.goto("/pl/users");
  await expect(page).toHaveURL(/\/pl\/users$/);
  await expect(page.getByRole("link", { name: "CV" }).first()).toBeVisible();
  await page.screenshot({ path: `${OUT}/auth-3-polish.png` });

  await page.goto("/en/users");
  await page.getByRole("button", { name: /Jan Kowalski/ }).click();
  await page.getByRole("menuitem", { name: "Logout" }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
  expect((await context.cookies()).map((cookie) => cookie.name)).not.toContain("access_token");
});
