import { render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PreferencesScript } from "./PreferencesScript";

// React does not execute rendered <script> tags, so the test runs its code the way the browser would.
const runScript = () => {
  const { container } = render(<PreferencesScript />);
  const code = container.querySelector("script")?.textContent ?? "";
  new Function(code)();
};

afterEach(() => {
  document.cookie = "theme=; path=/; max-age=0";
  document.cookie = "locale=; path=/; max-age=0";
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.lang = "";
});

describe("PreferencesScript", () => {
  it("applies the saved theme and language", () => {
    document.cookie = "theme=dark; path=/";
    document.cookie = "locale=pl; path=/";

    runScript();

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(document.documentElement.lang).toBe("pl");
  });

  it("leaves data-theme unset for system, so the OS decides", () => {
    document.cookie = "theme=system; path=/";

    runScript();

    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  });

  it("ignores unknown values", () => {
    document.cookie = "theme=purple; path=/";
    document.cookie = "locale=fr; path=/";

    runScript();

    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
    expect(document.documentElement.lang).toBe("");
  });
});
