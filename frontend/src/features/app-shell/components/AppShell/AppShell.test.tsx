import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MeDocument, type Role } from "@/shared/graphql";
import { renderWithProviders } from "@/shared/testing";
import { AppShell } from "./AppShell";

vi.mock("@/shared/i18n", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/i18n")>()),
  usePathname: () => "/users/7/profile",
}));

function meMock(role: Role) {
  const me = {
    __typename: "SessionUser" as const,
    id: "7",
    email: "ann@example.com",
    firstName: "Ann",
    lastName: "Lee",
    role,
    isVerified: true,
  };
  return { request: { query: MeDocument }, result: { data: { me } } };
}

describe("AppShell", () => {
  it("shows a user the 4 links and the page", async () => {
    renderWithProviders(<AppShell>Page content</AppShell>, { mocks: [meMock("USER")] });

    expect(await screen.findByRole("link", { name: "Skills" })).toHaveAttribute(
      "href",
      "/en/skills",
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    expect(screen.getByRole("main")).toHaveTextContent("Page content");
  });

  it("shows an admin the management pages", async () => {
    renderWithProviders(<AppShell>Page content</AppShell>, { mocks: [meMock("ADMIN")] });

    expect(await screen.findByRole("link", { name: "Skills" })).toHaveAttribute(
      "href",
      "/en/admin/skills",
    );
    expect(screen.getByRole("link", { name: "Projects" })).toBeInTheDocument();
  });

  it("marks the section of the current page and shows the signed-in user", async () => {
    renderWithProviders(<AppShell>Page content</AppShell>, { mocks: [meMock("USER")] });

    expect(await screen.findByRole("link", { name: "Employees" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("button", { name: /Ann Lee/ })).toBeInTheDocument();
  });
});
