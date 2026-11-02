import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { usePreferences } from "@/shared/preferences";
import { renderWithProviders } from "./renderWithProviders";

function ThemeButton() {
  const { theme, setTheme } = usePreferences();
  return (
    <button type="button" onClick={() => setTheme("dark")}>
      Theme: {theme}
    </button>
  );
}

// setTheme saves a cookie; clear it so other tests start from the defaults.
afterEach(() => {
  document.cookie = "theme=; path=/; max-age=0";
});

describe("renderWithProviders", () => {
  it("provides the preferences with their defaults", () => {
    renderWithProviders(<ThemeButton />);

    expect(screen.getByRole("button", { name: "Theme: system" })).toBeInTheDocument();
  });

  it("returns a user that interacts with the rendered component", async () => {
    const { user } = renderWithProviders(<ThemeButton />);

    await user.click(screen.getByRole("button"));

    expect(screen.getByRole("button", { name: "Theme: dark" })).toBeInTheDocument();
  });
});
