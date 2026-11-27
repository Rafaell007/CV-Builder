import { afterEach, describe, expect, it, vi } from "vitest";
import { getServerSnapshot, getSnapshot, saveTheme, subscribe } from "./preferences.store";

afterEach(() => {
  document.cookie = "theme=; path=/; max-age=0";
  document.documentElement.removeAttribute("data-theme");
});

describe("getSnapshot", () => {
  it("reads the saved theme from the cookie", () => {
    document.cookie = "theme=dark; path=/";

    expect(getSnapshot()).toEqual({ theme: "dark" });
  });

  it("returns the same object while the cookie is unchanged", () => {
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
  it("returns the default, even when the cookie is set", () => {
    document.cookie = "theme=dark; path=/";

    expect(getServerSnapshot()).toEqual({ theme: "system" });
  });
});

describe("saveTheme", () => {
  it("saves the cookie, updates <html> and notifies subscribers", () => {
    const listener = vi.fn();
    const unsubscribe = subscribe(listener);

    saveTheme("dark");

    expect(document.cookie).toContain("theme=dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it("stops notifying after unsubscribe", () => {
    const listener = vi.fn();
    subscribe(listener)();

    saveTheme("light");

    expect(listener).not.toHaveBeenCalled();
  });
});
