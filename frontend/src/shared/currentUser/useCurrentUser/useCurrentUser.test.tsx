import { describe, expect, it } from "vitest";
import { MeDocument } from "@/shared/graphql";
import { renderWithProviders, screen } from "@/shared/testing";
import { useCurrentUser } from "./useCurrentUser";

function sessionUser(role: "ADMIN" | "USER") {
  return {
    __typename: "SessionUser" as const,
    id: "1",
    email: "user1@example.com",
    firstName: "Ada",
    lastName: "Lovelace",
    role,
    isVerified: true,
  };
}

function meMock(me: ReturnType<typeof sessionUser> | null) {
  return { request: { query: MeDocument }, result: { data: { me } } };
}

function Probe() {
  const { user, loading, isAdmin } = useCurrentUser();
  if (loading) return <p>Loading</p>;
  return (
    <p>
      {user ? `${user.email} ${user.role}` : "Signed out"} · admin: {String(isAdmin)}
    </p>
  );
}

describe("useCurrentUser", () => {
  it("is loading until the me query answers", async () => {
    renderWithProviders(<Probe />, { mocks: [meMock(sessionUser("USER"))] });

    expect(screen.getByText("Loading")).toBeInTheDocument();
    expect(await screen.findByText(/user1@example.com/)).toBeInTheDocument();
  });

  it("returns a user who is not an admin", async () => {
    renderWithProviders(<Probe />, { mocks: [meMock(sessionUser("USER"))] });

    expect(await screen.findByText("user1@example.com USER · admin: false")).toBeInTheDocument();
  });

  it("returns an admin", async () => {
    renderWithProviders(<Probe />, { mocks: [meMock(sessionUser("ADMIN"))] });

    expect(await screen.findByText("user1@example.com ADMIN · admin: true")).toBeInTheDocument();
  });

  it("returns no user when nobody is signed in", async () => {
    renderWithProviders(<Probe />, { mocks: [meMock(null)] });

    expect(await screen.findByText("Signed out · admin: false")).toBeInTheDocument();
  });
});
