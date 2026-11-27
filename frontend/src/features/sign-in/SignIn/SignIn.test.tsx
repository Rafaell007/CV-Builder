import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen } from "@/shared/testing";
import { SignIn } from "./SignIn";

// Only the router is replaced: the form hook reads it, and the test helpers need the rest of the module.
vi.mock(import("@/shared/i18n"), async (importOriginal) =>
  (await import("@/shared/testing/withMockedRouter")).withMockedRouter(
    await importOriginal(),
    () => ({ replace: vi.fn() }),
  ),
);

describe("SignIn", () => {
  it("shows the title, the subtitle and the sign in form", () => {
    renderWithProviders(<SignIn />);

    expect(screen.getByRole("heading", { level: 1, name: "Welcome back" })).toBeInTheDocument();
    expect(screen.getByText("Hello again! Sign in to continue")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });

  it("marks the sign in tab as the current page", () => {
    renderWithProviders(<SignIn />);

    const tabs = screen.getByRole("navigation", { name: "Authentication" });
    expect(tabs).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "SIGN IN" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "SIGN UP" })).not.toHaveAttribute("aria-current");
  });

  it("shows the page in Polish", () => {
    renderWithProviders(<SignIn />, { locale: "pl" });

    expect(screen.getByRole("heading", { level: 1, name: "Witaj ponownie" })).toBeInTheDocument();
  });
});
