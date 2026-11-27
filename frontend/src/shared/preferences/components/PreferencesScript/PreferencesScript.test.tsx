import { render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PreferencesScript } from "./PreferencesScript";
import { PREFERENCES_SCRIPT } from "./preferencesScript.constants";

// React does not execute rendered <script> tags, so the test runs the same string the way the browser would.
const runScript = () => {
  new Function(PREFERENCES_SCRIPT)();
};

afterEach(() => {
  document.cookie = "theme=; path=/; max-age=0";
  document.documentElement.removeAttribute("data-theme");
});

describe("PreferencesScript rendering", () => {
  it("puts the script in the server HTML", () => {
    expect(renderToString(<PreferencesScript />)).toContain(PREFERENCES_SCRIPT.slice(0, 20));
  });

  it("renders nothing on the client, so React never creates a script element", () => {
    const { container } = render(<PreferencesScript />);

    expect(container.querySelector("script")).toBeNull();
  });

  it("hydrates the server HTML without a mismatch warning", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const container = document.createElement("div");
    container.innerHTML = renderToString(<PreferencesScript />);
    document.body.append(container);

    render(<PreferencesScript />, { container, hydrate: true });

    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
    container.remove();
  });
});

describe("PreferencesScript code", () => {
  it("applies the saved theme", () => {
    document.cookie = "theme=dark; path=/";

    runScript();

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("leaves data-theme unset for system, so the OS decides", () => {
    document.cookie = "theme=system; path=/";

    runScript();

    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  });

  it("ignores unknown values", () => {
    document.cookie = "theme=purple; path=/";

    runScript();

    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  });
});
