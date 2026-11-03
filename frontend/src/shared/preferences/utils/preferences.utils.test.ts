import { describe, expect, it } from "vitest";
import { parseTheme, readCookie } from "./preferences.utils";

describe("parseTheme", () => {
  it.each(["light", "dark", "system"])("returns %s when it is a valid theme", (theme) => {
    expect(parseTheme(theme)).toBe(theme);
  });

  it("falls back to system for an unknown value", () => {
    expect(parseTheme("purple")).toBe("system");
  });

  it("falls back to system when there is no value", () => {
    expect(parseTheme(undefined)).toBe("system");
  });
});

describe("readCookie", () => {
  it("reads a cookie from the middle of the string", () => {
    expect(readCookie("a=1; theme=dark; b=2", "theme")).toBe("dark");
  });

  it("does not match a cookie whose name only ends with the requested name", () => {
    expect(readCookie("mytheme=light", "theme")).toBeUndefined();
  });

  it("decodes the value", () => {
    expect(readCookie("note=a%20b", "note")).toBe("a b");
  });

  it("returns undefined when the cookie is missing", () => {
    expect(readCookie("", "theme")).toBeUndefined();
  });
});
