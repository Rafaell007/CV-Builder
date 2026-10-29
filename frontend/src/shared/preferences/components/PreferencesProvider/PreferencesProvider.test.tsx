import { act, render, renderHook, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { usePreferences } from "../../usePreferences";
import { PreferencesProvider } from "./PreferencesProvider";

const wrapper = ({ children }: { children: ReactNode }) => (
  <PreferencesProvider>{children}</PreferencesProvider>
);

const ThemeLabel = () => <p>{usePreferences().theme}</p>;

const app = (
  <PreferencesProvider>
    <ThemeLabel />
  </PreferencesProvider>
);

// A real server has no cookies: render the HTML before any cookie is set.
const renderServerHtml = () => {
  const container = document.createElement("div");
  container.innerHTML = renderToString(app);
  document.body.append(container);
  return container;
};

const clearCookie = (name: string) => {
  document.cookie = `${name}=; path=/; max-age=0`;
};

afterEach(() => {
  clearCookie("theme");
  clearCookie("locale");
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.lang = "";
});

describe("PreferencesProvider", () => {
  it("starts with defaults when there are no cookies", () => {
    const { result } = renderHook(() => usePreferences(), { wrapper });

    expect(result.current.theme).toBe("system");
    expect(result.current.language).toBe("en");
  });

  it("starts with the values saved in cookies", () => {
    document.cookie = "theme=dark; path=/";
    document.cookie = "locale=pl; path=/";

    const { result } = renderHook(() => usePreferences(), { wrapper });

    expect(result.current.theme).toBe("dark");
    expect(result.current.language).toBe("pl");
  });

  it("setTheme saves the cookie and sets data-theme", () => {
    const { result } = renderHook(() => usePreferences(), { wrapper });

    act(() => result.current.setTheme("dark"));

    expect(result.current.theme).toBe("dark");
    expect(document.cookie).toContain("theme=dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("setTheme('system') removes data-theme so the OS decides", () => {
    const { result } = renderHook(() => usePreferences(), { wrapper });

    act(() => result.current.setTheme("light"));
    act(() => result.current.setTheme("system"));

    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  });

  it("setLanguage saves the cookie and sets lang", () => {
    const { result } = renderHook(() => usePreferences(), { wrapper });

    act(() => result.current.setLanguage("pl"));

    expect(result.current.language).toBe("pl");
    expect(document.cookie).toContain("locale=pl");
    expect(document.documentElement.lang).toBe("pl");
  });

  it("renders the defaults on the server, which cannot read cookies", () => {
    document.cookie = "theme=dark; path=/";

    expect(renderToString(app)).toContain("system");
  });

  it("hydrates server HTML without a mismatch, then shows the saved theme", () => {
    const container = renderServerHtml();
    document.cookie = "theme=dark; path=/";
    const onRecoverableError = vi.fn();

    render(app, { container, hydrate: true, onRecoverableError });

    expect(screen.getByText("dark")).toBeDefined();
    expect(onRecoverableError).not.toHaveBeenCalled();
    container.remove();
  });

  it("keeps the theme set by PreferencesScript during hydration", () => {
    const container = renderServerHtml();
    document.cookie = "theme=dark; path=/";
    document.documentElement.setAttribute("data-theme", "dark");

    render(app, { container, hydrate: true });

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    container.remove();
  });
});
