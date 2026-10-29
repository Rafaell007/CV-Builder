import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getServerSnapshot,
  getSnapshot,
  saveLanguage,
  saveTheme,
  subscribe,
} from "./preferences.store";

afterEach(() => {
  document.cookie = "theme=; path=/; max-age=0";
  document.cookie = "locale=; path=/; max-age=0";
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.lang = "";
});

describe("getSnapshot", () => {
  it("reads the saved theme and language from cookies", () => {
    document.cookie = "theme=dark; path=/";
    document.cookie = "locale=pl; path=/";

    expect(getSnapshot()).toEqual({ theme: "dark", language: "pl" });
  });

  it("returns the same object while the cookies are unchanged", () => {
    document.cookie = "theme=light; path=/";

    expect(getSnapshot()).toBe(getSnapshot());
  });

  it("returns a new object after a change", () => {
    const before = getSnapshot();

    saveTheme("dark");

    expect(getSnapshot()).not.toBe(before);
  });
});

describe("getServerSnapshot", () => {
  it("returns the defaults, even when cookies are set", () => {
    document.cookie = "theme=dark; path=/";

    expect(getServerSnapshot()).toEqual({ theme: "system", language: "en" });
  });
});

describe("saveTheme and saveLanguage", () => {
  it("save the cookie, update <html> and notify subscribers", () => {
    const listener = vi.fn();
    const unsubscribe = subscribe(listener);

    saveTheme("dark");
    saveLanguage("pl");

    expect(document.cookie).toContain("theme=dark");
    expect(document.cookie).toContain("locale=pl");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(document.documentElement.lang).toBe("pl");
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
  });

  it("stop notifying after unsubscribe", () => {
    const listener = vi.fn();
    subscribe(listener)();

    saveTheme("light");

    expect(listener).not.toHaveBeenCalled();
  });
});
