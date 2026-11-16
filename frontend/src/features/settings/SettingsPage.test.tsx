import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen, within } from "@/shared/testing";
import { SettingsPage } from "./SettingsPage";

// The real navigation needs the Next.js app router, which tests do not have. The language select uses it.
vi.mock("@/shared/i18n/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/i18n/navigation")>()),
  usePathname: () => "/settings",
  useRouter: () => ({ replace: vi.fn() }),
}));

describe("SettingsPage", () => {
  it("shows the page title, the breadcrumb, both selects and the password form", () => {
    renderWithProviders(<SettingsPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Settings" })).toBeInTheDocument();
    expect(
      within(screen.getByRole("navigation", { name: "Breadcrumbs" })).getByText("Settings"),
    ).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Theme" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Language" })).toBeInTheDocument();
    expect(screen.getByRole("form", { name: "Change password" })).toBeInTheDocument();
  });

  it("shows the page in Polish", () => {
    renderWithProviders(<SettingsPage />, { locale: "pl" });

    expect(screen.getByRole("heading", { level: 1, name: "Ustawienia" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Motyw" })).toBeInTheDocument();
    expect(screen.getByRole("form", { name: "Zmiana hasła" })).toBeInTheDocument();
  });
});
