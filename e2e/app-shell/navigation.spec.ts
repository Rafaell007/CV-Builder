import { expect, test } from "@playwright/test";
import { ADMIN_EMAIL, signIn, USER_EMAIL } from "../support/signIn";

// The app shell (KAN-82): sidebar links by role, the current page marked, collapse, profile menu, device gate.
test.describe("app shell", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("a user sees 4 links and the clicked page is marked as current", async ({
    page,
    context,
  }) => {
    await signIn(context, USER_EMAIL);
    await page.goto("/users");
    const navigation = page.getByRole("navigation", { name: "Main navigation" });

    await expect(navigation.getByRole("link")).toHaveCount(4);
    await expect(navigation.getByRole("link", { name: "Employees" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await navigation.getByRole("link", { name: "Skills" }).click();

    await expect(page).toHaveURL(/\/en\/skills$/);
    await expect(navigation.getByRole("link", { name: "Skills" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("an admin sees 7 links and Skills opens the admin page", async ({ page, context }) => {
    await signIn(context, ADMIN_EMAIL);
    await page.goto("/users");
    const navigation = page.getByRole("navigation", { name: "Main navigation" });

    await expect(navigation.getByRole("link")).toHaveCount(7);

    await navigation.getByRole("link", { name: "Skills" }).click();

    await expect(page).toHaveURL(/\/en\/admin\/skills$/);
  });

  test("the collapse button collapses and expands the sidebar", async ({ page, context }) => {
    await signIn(context, USER_EMAIL);
    await page.goto("/users");
    const toggle = page.getByRole("button", { name: "Sidebar" });

    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
  });

  test("the profile menu opens the profile and settings", async ({ page, context }) => {
    await signIn(context, USER_EMAIL);
    await page.goto("/users");

    await page.getByRole("button", { name: /Jan Kowalski/ }).click();
    await page.getByRole("menuitem", { name: "Profile" }).click();
    await expect(page).toHaveURL(/\/en\/users\/[^/]+\/profile$/);

    await page.getByRole("button", { name: /Jan Kowalski/ }).click();
    await page.getByRole("menuitem", { name: "Settings" }).click();
    await expect(page).toHaveURL(/\/en\/settings$/);
  });

  test("Logout ends the session", async ({ page, context }) => {
    await signIn(context, USER_EMAIL);
    await page.goto("/users");

    await page.getByRole("button", { name: /Jan Kowalski/ }).click();
    await page.getByRole("menuitem", { name: "Logout" }).click();

    await expect(page).toHaveURL(/\/sign-in$/);
    await page.goto("/users");
    await expect(page).toHaveURL(/\/sign-in$/);
  });
});

test.describe("device gate", () => {
  test("below 768px the device error replaces the page", async ({ page, context }) => {
    await page.setViewportSize({ width: 767, height: 1024 });
    await signIn(context, USER_EMAIL);
    await page.goto("/users");

    await expect(page.getByRole("heading", { level: 1, name: "Oops" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeHidden();
  });

  test("from 768px the page shows and the sidebar starts collapsed", async ({ page, context }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await signIn(context, USER_EMAIL);
    await page.goto("/users");

    await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Oops" })).toBeHidden();
    await expect(page.getByRole("button", { name: "Sidebar" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });
});
