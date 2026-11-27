import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SignOutDocument } from "@/shared/graphql";
import { redirectToSignIn } from "@/shared/session";
import { renderWithProviders } from "@/shared/testing";
import { useSignOut } from "./useSignOut";

vi.mock("@/shared/session", () => ({ redirectToSignIn: vi.fn() }));

function SignOutButton() {
  const { signOut } = useSignOut();
  return (
    <button type="button" onClick={signOut}>
      Logout
    </button>
  );
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("useSignOut", () => {
  it("goes to the sign-in page after the backend ends the session", async () => {
    const { user } = renderWithProviders(<SignOutButton />, {
      mocks: [{ request: { query: SignOutDocument }, result: { data: { signOut: true } } }],
    });

    await user.click(screen.getByRole("button", { name: "Logout" }));

    await vi.waitFor(() => expect(redirectToSignIn).toHaveBeenCalledOnce());
  });

  it("stays on the page and shows an error when the request fails", async () => {
    const { user } = renderWithProviders(<SignOutButton />, {
      mocks: [{ request: { query: SignOutDocument }, error: new Error("Network down") }],
    });

    await user.click(screen.getByRole("button", { name: "Logout" }));

    expect(await screen.findByText("Could not log out. Please try again.")).toBeInTheDocument();
    expect(redirectToSignIn).not.toHaveBeenCalled();
  });
});
