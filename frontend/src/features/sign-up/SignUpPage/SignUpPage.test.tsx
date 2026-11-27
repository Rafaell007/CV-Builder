import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen } from "@/shared/testing";
import { SignUpPage } from "./SignUpPage";

// Only the router is replaced: the form hook reads it, and the test helpers need the rest of the module.
vi.mock(import("@/shared/i18n"), async (importOriginal) =>
  (await import("@/shared/testing/withMockedRouter")).withMockedRouter(
    await importOriginal(),
    () => ({ replace: vi.fn() }),
  ),
);

describe("SignUpPage", () => {
  it("shows the title, the subtitle and the sign up form", () => {
    renderWithProviders(<SignUpPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Sign up now" })).toBeInTheDocument();
    expect(screen.getByText("Welcome! Sign up to continue")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();
  });

  it("marks the sign up tab as the current page", () => {
    renderWithProviders(<SignUpPage />);

    expect(screen.getByRole("navigation", { name: "Authentication" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "SIGN UP" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "SIGN IN" })).not.toHaveAttribute("aria-current");
  });

  it("shows the page in Polish", () => {
    renderWithProviders(<SignUpPage />, { locale: "pl" });

    expect(screen.getByRole("heading", { level: 1, name: "Zarejestruj się" })).toBeInTheDocument();
  });
});
