import { describe, expect, it } from "vitest";
import { renderWithProviders, screen } from "@/shared/testing";
import { AuthTabs } from "./index";

describe("AuthTabs", () => {
  it("links to both pages", () => {
    renderWithProviders(<AuthTabs active="sign-up" />);

    expect(screen.getByRole("link", { name: "SIGN IN" })).toHaveAttribute("href", "/sign-in");
    expect(screen.getByRole("link", { name: "SIGN UP" })).toHaveAttribute("href", "/sign-up");
  });

  it("marks only the active tab as the current page", () => {
    renderWithProviders(<AuthTabs active="sign-up" />);

    expect(screen.getByRole("link", { name: "SIGN UP" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "SIGN IN" })).not.toHaveAttribute("aria-current");
  });
});
