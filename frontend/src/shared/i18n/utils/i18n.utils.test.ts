import { describe, expect, it } from "vitest";
import { splitLocale } from "./i18n.utils";

describe("splitLocale", () => {
  it("splits a supported language off the path", () => {
    expect(splitLocale("/pl/users/1/profile")).toEqual({ locale: "pl", path: "/users/1/profile" });
  });

  it("gives the root path for a bare language", () => {
    expect(splitLocale("/en")).toEqual({ locale: "en", path: "/" });
  });

  it("returns no language for a path without one", () => {
    expect(splitLocale("/users")).toEqual({ locale: null, path: "/users" });
  });

  it("treats an unsupported language as a normal segment", () => {
    expect(splitLocale("/de/users")).toEqual({ locale: null, path: "/de/users" });
  });

  it("handles the root path", () => {
    expect(splitLocale("/")).toEqual({ locale: null, path: "/" });
  });
});
