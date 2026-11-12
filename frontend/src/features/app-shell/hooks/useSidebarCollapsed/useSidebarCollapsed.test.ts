import { act, renderHook } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NARROW_SCREEN_QUERY, useSidebarCollapsed } from "./useSidebarCollapsed";

// A matchMedia stand-in whose result the test can change, like resizing the window.
function stubScreen(narrow: boolean) {
  const listeners = new Set<() => void>();
  const query = {
    matches: narrow,
    addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
  };
  vi.stubGlobal("matchMedia", () => query);
  return {
    resize(nextNarrow: boolean) {
      query.matches = nextNarrow;
      listeners.forEach((listener) => listener());
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useSidebarCollapsed", () => {
  it("uses the breakpoint of AppShell.module.css, which cannot read it from here", () => {
    // Tests run from the frontend folder.
    const css = readFileSync(
      resolve("src/features/app-shell/components/AppShell/AppShell.module.css"),
      "utf8",
    );

    expect(css).toContain(`@media ${NARROW_SCREEN_QUERY}`);
  });

  it("is expanded on a wide screen and collapsed on a narrow one", () => {
    stubScreen(false);
    expect(renderHook(() => useSidebarCollapsed()).result.current.collapsed).toBe(false);

    stubScreen(true);
    expect(renderHook(() => useSidebarCollapsed()).result.current.collapsed).toBe(true);
  });

  it("follows the screen width while the user has not clicked", () => {
    const screen = stubScreen(false);
    const { result } = renderHook(() => useSidebarCollapsed());

    act(() => screen.resize(true));

    expect(result.current.collapsed).toBe(true);
    expect(result.current.userChoice).toBeNull();
  });

  it("keeps the user's click even when the width changes", () => {
    const screen = stubScreen(true);
    const { result } = renderHook(() => useSidebarCollapsed());

    act(() => result.current.toggle());
    act(() => screen.resize(false));
    act(() => screen.resize(true));

    expect(result.current.collapsed).toBe(false);
    expect(result.current.userChoice).toBe(false);
  });
});
