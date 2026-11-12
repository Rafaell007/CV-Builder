import { describe, expect, it } from "vitest";
import { isPathActive } from "./path.utils";

describe("isPathActive", () => {
  it("matches the same route and the routes below it", () => {
    expect(isPathActive("/users/1", "/users/1")).toBe(true);
    expect(isPathActive("/users/1", "/users/1/skills")).toBe(true);
  });

  it("does not match a route that only shares the start of the text", () => {
    expect(isPathActive("/users/1", "/users/10")).toBe(false);
  });
});
