import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/shared/testing";
import { meMock } from "../../user-details.mocks";
import { UserLayout } from "./UserLayout";

vi.mock("@/shared/i18n", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/i18n")>()),
  usePathname: () => "/users/10/cvs",
}));

const setup = (role: "ADMIN" | "USER") =>
  renderWithProviders(
    <UserLayout userId="10">
      <p>Tab page</p>
    </UserLayout>,
    { mocks: [meMock(role)] },
  );

const tabs = () => screen.getByRole("navigation", { name: "Employee sections" });

describe("UserLayout", () => {
  it("shows the four tabs to an admin, with links to the routes of the user, and marks CVs", async () => {
    setup("ADMIN");

    const cvsTab = await within(tabs()).findByRole("link", { name: "CVs" });
    expect(cvsTab).toHaveAttribute("href", "/en/users/10/cvs");
    expect(cvsTab).toHaveAttribute("aria-current", "page");
    expect(
      within(tabs())
        .getAllByRole("link")
        .map((link) => link.textContent),
    ).toEqual(["Profile", "Skills", "Languages", "CVs"]);
  });

  it("hides the CVs tab from anyone who is not an admin", async () => {
    setup("USER");

    await within(tabs()).findByRole("link", { name: "Profile" });
    expect(within(tabs()).queryByRole("link", { name: "CVs" })).not.toBeInTheDocument();
  });

  it("shows the breadcrumbs Employees and the tab, and the page", async () => {
    setup("ADMIN");

    expect(await screen.findByText("Tab page")).toBeInTheDocument();
    const breadcrumbs = await screen.findByRole("navigation", { name: "Breadcrumbs" });
    expect(
      within(breadcrumbs)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(["Employees", "CVs"]);
    expect(within(breadcrumbs).getByRole("link", { name: "Employees" })).toHaveAttribute(
      "href",
      "/en/users",
    );
  });
});
