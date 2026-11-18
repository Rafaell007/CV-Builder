import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen } from "@/shared/testing";
import { PreferencesFields } from "./index";

// The real navigation needs the Next.js app router, which tests do not have. `useLanguage` switches through it.
const replace = vi.fn();
vi.mock("@/shared/i18n/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/i18n/navigation")>()),
  usePathname: () => "/settings",
  useRouter: () => ({ replace }),
}));

afterEach(() => {
  replace.mockClear();
  document.cookie = "theme=; path=/; max-age=0";
  document.documentElement.removeAttribute("data-theme");
});

const themeSelect = () => screen.getByRole("combobox", { name: "Theme" });
const languageSelect = () => screen.getByRole("combobox", { name: "Language" });

describe("PreferencesFields", () => {
  it("shows the current theme and language", () => {
    renderWithProviders(<PreferencesFields />);

    expect(themeSelect()).toHaveTextContent("Device settings");
    expect(languageSelect()).toHaveTextContent("English");
  });

  it("offers every theme", async () => {
    const { user } = renderWithProviders(<PreferencesFields />);

    await user.click(themeSelect());

    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
      "Light",
      "Dark",
      "Device settings",
    ]);
  });

  it("applies and saves the chosen theme", async () => {
    const { user } = renderWithProviders(<PreferencesFields />);

    await user.click(themeSelect());
    await user.click(screen.getByRole("option", { name: "Dark" }));

    expect(themeSelect()).toHaveTextContent("Dark");
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(document.cookie).toContain("theme=dark");
  });

  it("offers each language in its own name and opens the page in the chosen one", async () => {
    const { user } = renderWithProviders(<PreferencesFields />);

    await user.click(languageSelect());
    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
      "English",
      "Polski",
    ]);
    await user.click(screen.getByRole("option", { name: "Polski" }));

    expect(replace).toHaveBeenCalledWith("/settings", { locale: "pl" });
  });

  it("shows the labels in Polish", () => {
    renderWithProviders(<PreferencesFields />, { locale: "pl" });

    expect(screen.getByRole("combobox", { name: "Motyw" })).toHaveTextContent(
      "Ustawienia urządzenia",
    );
    expect(screen.getByRole("combobox", { name: "Język" })).toHaveTextContent("Polski");
  });
});
