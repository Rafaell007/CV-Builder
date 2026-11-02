import { describe, expect, it } from "vitest";
import { getRouteKind, isAccessTokenFresh, resolveRedirect } from "./session.utils";

const NOW_MS = Date.UTC(2026, 10, 2, 12, 0, 0);

function tokenExpiringAt(expMs: number): string {
  const payload = btoa(JSON.stringify({ sub: "1", exp: Math.floor(expMs / 1000) }))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `header.${payload}.signature`;
}

describe("getRouteKind", () => {
  it.each(["/sign-in", "/sign-up"])("treats %s as guest-only", (path) => {
    expect(getRouteKind(path)).toBe("guest-only");
  });

  it.each([
    "/users",
    "/users/42/profile",
    "/users/42/skills",
    "/cvs",
    "/cvs/7/preview",
    "/skills",
    "/languages",
    "/settings",
    "/verify-email",
  ])("treats %s as protected", (path) => {
    expect(getRouteKind(path)).toBe("protected");
  });

  it.each(["/admin/skills", "/admin/projects", "/users/42/cvs"])(
    "treats %s as admin-only",
    (path) => {
      expect(getRouteKind(path)).toBe("admin-only");
    },
  );

  it.each(["/forgot-password", "/reset-password", "/nope", "/usersX", "/administrators"])(
    "treats %s as public",
    (path) => {
      expect(getRouteKind(path)).toBe("public");
    },
  );
});

describe("resolveRedirect", () => {
  it("shows a public route to everyone", () => {
    expect(resolveRedirect("public", false, null)).toBeNull();
    expect(resolveRedirect("public", true, "USER")).toBeNull();
  });

  it("sends a signed-in user away from a guest-only route", () => {
    expect(resolveRedirect("guest-only", true, null)).toBe("/users");
    expect(resolveRedirect("guest-only", true, "ADMIN")).toBe("/users");
  });

  it("shows a guest-only route to a visitor without a session", () => {
    expect(resolveRedirect("guest-only", false, null)).toBeNull();
  });

  it("sends a visitor without a session from a protected route to sign-in", () => {
    expect(resolveRedirect("protected", false, null)).toBe("/sign-in");
  });

  it("shows a protected route to every signed-in visitor, with or without a known role", () => {
    expect(resolveRedirect("protected", true, null)).toBeNull();
    expect(resolveRedirect("protected", true, "USER")).toBeNull();
    expect(resolveRedirect("protected", true, "ADMIN")).toBeNull();
  });

  it("sends a visitor without a session from an admin-only route to sign-in", () => {
    expect(resolveRedirect("admin-only", false, null)).toBe("/sign-in");
  });

  it("blocks a user from an admin-only route", () => {
    expect(resolveRedirect("admin-only", true, "USER")).toBe("/users");
  });

  it("shows an admin-only route to an admin", () => {
    expect(resolveRedirect("admin-only", true, "ADMIN")).toBeNull();
  });
});

describe("isAccessTokenFresh", () => {
  it("accepts a token that expires in the future", () => {
    expect(isAccessTokenFresh(tokenExpiringAt(NOW_MS + 5 * 60_000), NOW_MS)).toBe(true);
  });

  it("rejects a token that has expired", () => {
    expect(isAccessTokenFresh(tokenExpiringAt(NOW_MS - 1000), NOW_MS)).toBe(false);
  });

  it("rejects a token that expires within the safety margin", () => {
    expect(isAccessTokenFresh(tokenExpiringAt(NOW_MS + 5000), NOW_MS)).toBe(false);
  });

  it("rejects a missing token", () => {
    expect(isAccessTokenFresh(undefined, NOW_MS)).toBe(false);
    expect(isAccessTokenFresh("", NOW_MS)).toBe(false);
  });

  it.each(["garbage", "a.b.c", "a..c", `a.${btoa("{}")}.c`])(
    "rejects the malformed token %s",
    (token) => {
      expect(isAccessTokenFresh(token, NOW_MS)).toBe(false);
    },
  );
});
