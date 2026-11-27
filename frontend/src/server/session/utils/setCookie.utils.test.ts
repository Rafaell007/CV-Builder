import { describe, expect, it } from "vitest";
import {
  applySetCookies,
  clearSessionCookies,
  parseSetCookie,
  toCookieHeader,
  toResponseCookies,
} from "./setCookie.utils";

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

describe("clearSessionCookies", () => {
  it("deletes both session cookies with the attributes the backend uses", () => {
    expect(clearSessionCookies(false)).toEqual([
      "access_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax",
      "refresh_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax",
    ]);
  });

  it("adds Secure over HTTPS", () => {
    expect(clearSessionCookies(true).every((header) => header.endsWith("; Secure"))).toBe(true);
  });
});

describe("toResponseCookies", () => {
  it("keeps the name, the value and every attribute the backend set", () => {
    expect(
      toResponseCookies([
        "access_token=abc.def-_; Path=/; Max-Age=900; HttpOnly; SameSite=Lax; Secure",
        "refresh_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax",
      ]),
    ).toEqual([
      expect.objectContaining({
        name: "access_token",
        value: "abc.def-_",
        path: "/",
        maxAge: 900,
        httpOnly: true,
        sameSite: "lax",
        secure: true,
      }),
      expect.objectContaining({ name: "refresh_token", value: "" }),
    ]);
  });

  it("deletes a cleared cookie with an expiry in the past, also when it was cleared with Max-Age=0", () => {
    const [cleared] = toResponseCookies(["refresh_token=; Path=/; Max-Age=0; HttpOnly"]);

    expect(cleared).toMatchObject({ value: "", path: "/", expires: new Date(0) });
  });

  it("returns nothing for no headers", () => {
    expect(toResponseCookies([])).toEqual([]);
  });
});
