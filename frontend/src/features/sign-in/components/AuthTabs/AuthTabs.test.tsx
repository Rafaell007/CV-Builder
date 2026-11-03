import { describe, expect, it } from "vitest";
import { renderWithProviders, screen } from "@/shared/testing";
import { AuthTabs } from "./AuthTabs";

describe("AuthTabs", () => {
  it("marks the sign in tab as the current page", () => {
    renderWithProviders(<AuthTabs active="sign-in" />);

    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Sign up" })).not.toHaveAttribute("aria-current");
  });

  it("links the sign up tab to the sign up page, in the current language", () => {
    renderWithProviders(<AuthTabs active="sign-in" />, { locale: "pl" });

    expect(screen.getByRole("link", { name: "Rejestracja" })).toHaveAttribute(
      "href",
      "/pl/sign-up",
    );
  });
});
