// Not in a folder like other tested files: Next.js needs `proxy.ts` at `src/proxy.ts`.
import { NextRequest, NextResponse } from "next/server";
import { describe, expect, it, vi } from "vitest";
import { config, proxy } from "./proxy";

const handleRequest = vi.hoisted(() => vi.fn());

// The session rules have their own tests in server/session/handleRequest; here only the wiring is checked.
vi.mock("@/server/session", () => ({ handleRequest }));
vi.mock("@/server/env", () => ({ serverEnv: { backendUrl: "http://backend.test:4000" } }));

describe("proxy", () => {
  it("runs the session rules with the request and the backend origin", () => {
    const request = new NextRequest("http://localhost:3000/en/users");
    const response = NextResponse.next();
    handleRequest.mockReturnValue(response);

    expect(proxy(request)).toBe(response);

    expect(handleRequest).toHaveBeenCalledExactlyOnceWith(request, "http://backend.test:4000");
  });
});

describe("proxy matcher", () => {
  // Next.js reads the pattern as a path-to-regexp string; anchored, it is also a plain regular expression.
  const [pattern] = config.matcher;
  const matcher = new RegExp(`^${pattern}$`);

  it.each(["/", "/en", "/en/users", "/pl/sign-in", "/en/cvs/12/preview", "/graphqlx", "/apix"])(
    "runs for the page %s",
    (path) => {
      expect(matcher.test(path)).toBe(true);
    },
  );

  it("runs for a page path with a dot, so the session check still sees it", () => {
    expect(matcher.test("/en/users/john.doe")).toBe(true);
  });

  it.each(["/graphql", "/graphql/upload", "/api/health"])(
    "skips the backend rewrite %s",
    (path) => {
      expect(matcher.test(path)).toBe(false);
    },
  );

  it.each(["/_next/static/chunks/main.js", "/_next/image"])(
    "skips the Next.js internal path %s",
    (path) => {
      expect(matcher.test(path)).toBe(false);
    },
  );

  it.each([
    "/favicon.ico",
    "/robots.txt",
    "/logo.svg",
    "/images/photo.jpg",
    "/fonts/inter.woff2",
    "/app.webmanifest",
  ])("skips the static asset file %s", (path) => {
    expect(matcher.test(path)).toBe(false);
  });
});
