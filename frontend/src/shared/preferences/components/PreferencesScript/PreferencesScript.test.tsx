import { afterEach, describe, expect, it } from "vitest";
import { PREFERENCES_SCRIPT } from "./preferencesScript.constants";

// next/script injects the code outside React, so the test runs the same string the way the browser would.
const runScript = () => {
  new Function(PREFERENCES_SCRIPT)();
};

afterEach(() => {
  document.cookie = "theme=; path=/; max-age=0";
  document.documentElement.removeAttribute("data-theme");
});

describe("PreferencesScript", () => {
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
