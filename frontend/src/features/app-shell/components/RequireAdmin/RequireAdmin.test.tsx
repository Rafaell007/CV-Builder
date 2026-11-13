import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MeDocument, type Role } from "@/shared/graphql";
import { renderWithProviders } from "@/shared/testing";
import { RequireAdmin } from "./RequireAdmin";

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

describe("RequireAdmin", () => {
  it("shows a loading state, not the page, while the user loads", () => {
    renderWithProviders(<RequireAdmin>Secret page</RequireAdmin>, { mocks: [meMock("ADMIN")] });

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText("Secret page")).not.toBeInTheDocument();
  });

  it("shows the page to an Admin", async () => {
    renderWithProviders(<RequireAdmin>Secret page</RequireAdmin>, { mocks: [meMock("ADMIN")] });

    expect(await screen.findByText("Secret page")).toBeInTheDocument();
  });

  it("shows Forbidden with a link back to a user who is not an Admin", async () => {
    renderWithProviders(<RequireAdmin>Secret page</RequireAdmin>, { mocks: [meMock("USER")] });

    expect(await screen.findByRole("alert")).toHaveTextContent("No access");
    expect(screen.getByRole("link", { name: "Back to Employees" })).toHaveAttribute(
      "href",
      "/en/users",
    );
    expect(screen.queryByText("Secret page")).not.toBeInTheDocument();
  });
});
