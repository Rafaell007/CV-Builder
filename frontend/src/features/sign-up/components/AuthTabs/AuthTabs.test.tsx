import { describe, expect, it } from "vitest";
import { renderWithProviders, screen } from "@/shared/testing";
import { AuthTabs } from "./index";

const LABELS = { label: "Authentication", signInLabel: "SIGN IN", signUpLabel: "SIGN UP" };

describe("AuthTabs", () => {
  it("links to both pages in the current language", () => {
    renderWithProviders(<AuthTabs active="sign-up" {...LABELS} />, { locale: "pl" });

    expect(screen.getByRole("navigation", { name: "Authentication" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "SIGN IN" })).toHaveAttribute("href", "/pl/sign-in");
    expect(screen.getByRole("link", { name: "SIGN UP" })).toHaveAttribute("href", "/pl/sign-up");
  });

  it("marks only the active tab as the current page", () => {
    renderWithProviders(<AuthTabs active="sign-up" {...LABELS} />);

    expect(screen.getByRole("link", { name: "SIGN UP" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "SIGN IN" })).not.toHaveAttribute("aria-current");
  });
});
