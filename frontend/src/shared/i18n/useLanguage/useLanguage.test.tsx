import { act, renderHook } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useLanguage } from "./useLanguage";

// The real navigation needs the Next.js router, which tests do not have.
const replace = vi.fn();
vi.mock("../navigation", () => ({
  usePathname: () => "/settings",
  useRouter: () => ({ replace }),
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <NextIntlClientProvider locale="pl">{children}</NextIntlClientProvider>
);

afterEach(() => {
  replace.mockClear();
  window.history.replaceState(null, "", "/");
});

describe("useLanguage", () => {
  it("returns the current language and the supported ones", () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });

    expect(result.current.language).toBe("pl");
    expect(result.current.languages).toEqual(["en", "pl"]);
  });

  it("opens the same page in the new language", () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });

    act(() => result.current.setLanguage("en"));

    expect(replace).toHaveBeenCalledWith("/settings", { locale: "en" });
  });

  it("keeps the query string, so a search or a page number survives the switch", () => {
    window.history.replaceState(null, "", "/pl/settings?search=ann&page=3");
    const { result } = renderHook(() => useLanguage(), { wrapper });

    act(() => result.current.setLanguage("en"));

    expect(replace).toHaveBeenCalledWith("/settings?search=ann&page=3", { locale: "en" });
  });
});
