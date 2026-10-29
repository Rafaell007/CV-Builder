import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { PreferencesProvider } from "../components/PreferencesProvider";
import { usePreferences } from "./usePreferences";

const wrapper = ({ children }: { children: ReactNode }) => (
  <PreferencesProvider>{children}</PreferencesProvider>
);

describe("usePreferences", () => {
  it("returns the preferences and setters inside PreferencesProvider", () => {
    const { result } = renderHook(() => usePreferences(), { wrapper });

    expect(result.current).toEqual({
      theme: "system",
      language: "en",
      setTheme: expect.any(Function),
      setLanguage: expect.any(Function),
    });
  });

  it("throws when used outside PreferencesProvider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => renderHook(() => usePreferences())).toThrow(
      "usePreferences must be used inside PreferencesProvider",
    );
  });
});
