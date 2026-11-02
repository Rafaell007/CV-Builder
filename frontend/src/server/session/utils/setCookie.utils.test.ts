import { describe, expect, it } from "vitest";
import { applySetCookies, parseSetCookie, toCookieHeader } from "./setCookie.utils";

describe("parseSetCookie", () => {
  it("reads the name and value and ignores the attributes", () => {
    expect(
      parseSetCookie("access_token=abc.def; Max-Age=900; Path=/; HttpOnly; SameSite=Lax"),
    ).toEqual({
      name: "access_token",
      value: "abc.def",
    });
  });

  it("keeps an equals sign inside the value", () => {
    expect(parseSetCookie("a=b=c; Path=/")).toEqual({ name: "a", value: "b=c" });
  });

  it("returns null for a header without a name", () => {
    expect(parseSetCookie("; Path=/")).toBeNull();
    expect(parseSetCookie("novalue")).toBeNull();
  });
});

describe("applySetCookies", () => {
  it("adds and replaces cookies", () => {
    const jar = new Map([["access_token", "old"]]);

    applySetCookies(jar, ["access_token=new; Path=/", "refresh_token=r; Path=/"]);

    expect(Object.fromEntries(jar)).toEqual({ access_token: "new", refresh_token: "r" });
  });

  it("removes a cookie the backend cleared", () => {
    const jar = new Map([
      ["access_token", "a"],
      ["refresh_token", "r"],
    ]);

    applySetCookies(jar, ["access_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT"]);

    expect(Object.fromEntries(jar)).toEqual({ refresh_token: "r" });
  });
});

describe("toCookieHeader", () => {
  it("joins the cookies into one request header", () => {
    expect(
      toCookieHeader(
        new Map([
          ["a", "1"],
          ["b", "2"],
        ]),
      ),
    ).toBe("a=1; b=2");
  });

  it("returns an empty string for an empty jar", () => {
    expect(toCookieHeader(new Map())).toBe("");
  });
});
