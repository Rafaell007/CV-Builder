import { screen } from "@testing-library/react";
import { useTranslations } from "next-intl";
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

function Title() {
  return <h1>{useTranslations("common")("employees")}</h1>;
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

  it("translates with English messages by default", () => {
    renderWithProviders(<Title />);

    expect(screen.getByRole("heading", { name: "Employees" })).toBeInTheDocument();
  });

  it("translates in the requested language", () => {
    renderWithProviders(<Title />, { locale: "pl" });

    expect(screen.getByRole("heading", { name: "Pracownicy" })).toBeInTheDocument();
  });

  it("returns a user that interacts with the rendered component", async () => {
    const { user } = renderWithProviders(<ThemeButton />);

    await user.click(screen.getByRole("button"));

    expect(screen.getByRole("button", { name: "Theme: dark" })).toBeInTheDocument();
  });
});
