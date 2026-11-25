import { act, screen, within } from "@testing-library/react";
import { Suspense } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/shared/testing";
import { meMock, userMock } from "../../user-details.mocks";
import { UserLayout } from "./UserLayout";
import { UserLayoutSkeleton } from "./UserLayoutSkeleton";

vi.mock("@/shared/i18n", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/i18n")>()),
  usePathname: () => "/users/10/cvs",
}));

// The layout reads its queries with useSuspenseQuery; on the page the route layout preloads them on the server.
const render = (role: "ADMIN" | "USER", user = userMock("10")) =>
  renderWithProviders(
    <Suspense fallback={<p>Suspended</p>}>
      <UserLayout userId="10">
        <p>Tab page</p>
      </UserLayout>
    </Suspense>,
    { mocks: [meMock(role), user] },
  );

// React 19 shows a suspended tree only inside an awaited act(); without it the fallback never leaves.
const setup = async (role: "ADMIN" | "USER", user?: ReturnType<typeof userMock>) => {
  await act(async () => {
    render(role, user);
  });
};

const tabs = () => screen.getByRole("navigation", { name: "Employee sections" });

const breadcrumbTexts = async () =>
  within(await screen.findByRole("navigation", { name: "Breadcrumbs" }))
    .getAllByRole("listitem")
    .map((item) => item.textContent);

describe("UserLayout", () => {
  it("shows the four tabs to an admin, with links to the routes of the user, and marks CVs", async () => {
    await setup("ADMIN");

    const cvsTab = await screen.findByRole("link", { name: "CVs" });
    expect(cvsTab).toHaveAttribute("href", "/en/users/10/cvs");
    expect(cvsTab).toHaveAttribute("aria-current", "page");
    expect(
      within(tabs())
        .getAllByRole("link")
        .map((link) => link.textContent),
    ).toEqual(["Profile", "Skills", "Languages", "CVs"]);
  });

  it("hides the CVs tab from anyone who is not an admin", async () => {
    await setup("USER");

    await screen.findByRole("link", { name: "Profile" });
    expect(within(tabs()).queryByRole("link", { name: "CVs" })).not.toBeInTheDocument();
  });

  it("shows the breadcrumbs Employees, the name of the user and the tab, and the page", async () => {
    await setup("ADMIN");

    expect(await screen.findByText("Tab page")).toBeInTheDocument();
    expect(await breadcrumbTexts()).toEqual(["Employees", "Emma Employee", "CVs"]);
    const breadcrumbs = screen.getByRole("navigation", { name: "Breadcrumbs" });
    expect(within(breadcrumbs).getByRole("link", { name: "Employees" })).toHaveAttribute(
      "href",
      "/en/users",
    );
    expect(
      within(breadcrumbs).queryByRole("link", { name: "Emma Employee" }),
    ).not.toBeInTheDocument();
  });

  it("shows the email in the breadcrumbs for a user who has no name yet", async () => {
    await setup("ADMIN", userMock("10", { firstName: null, lastName: null }));

    expect(await breadcrumbTexts()).toEqual(["Employees", "emma@example.com", "CVs"]);
  });

  it("waits for both queries before it draws the shell", async () => {
    await setup("USER");

    expect(screen.getByText("Suspended")).toBeInTheDocument();
    expect(await screen.findByText("Tab page")).toBeInTheDocument();
    expect(screen.queryByText("Suspended")).not.toBeInTheDocument();
  });
});

describe("UserLayoutSkeleton", () => {
  it("shows the breadcrumbs Employees › Loading employee and a loading skeleton, but no tabs", async () => {
    renderWithProviders(<UserLayoutSkeleton />);

    expect(screen.getByRole("status", { name: "Loading employee" })).toHaveAttribute(
      "aria-busy",
      "true",
    );
    expect(await breadcrumbTexts()).toEqual(["Employees", "Loading employee"]);
    const breadcrumbs = screen.getByRole("navigation", { name: "Breadcrumbs" });
    expect(within(breadcrumbs).getByRole("link", { name: "Employees" })).toHaveAttribute(
      "href",
      "/en/users",
    );
    expect(screen.getByRole("heading", { level: 1, name: "Loading employee" })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Employee sections" })).not.toBeInTheDocument();
  });
});
