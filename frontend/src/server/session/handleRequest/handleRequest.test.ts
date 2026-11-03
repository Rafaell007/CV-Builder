import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

// resolveSession keeps finished refreshes for a few seconds, so each call loads a fresh copy of the module.
async function proxy(request: NextRequest) {
  vi.resetModules();
  const { handleRequest } = await import("./handleRequest");
  return handleRequest(request, "http://backend");
}

const FRESH = `h.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 600 }))}.s`;
const EXPIRED = `h.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 60 }))}.s`;

type Cookies = { access?: string; refresh?: string; locale?: string };

// `path` is language-free; the request URL starts with `urlLocale` (null = no language). The `locale` cookie
// matches the URL by default, so next-intl has no cookie of its own to set and the tests see only session cookies.
function requestFor(
  path: string,
  { access, refresh, locale = "en" }: Cookies = {},
  urlLocale: string | null = "en",
) {
  const cookie = [
    locale && `locale=${locale}`,
    access && `access_token=${access}`,
    refresh && `refresh_token=${refresh}`,
  ]
    .filter(Boolean)
    .join("; ");
  const url = `http://localhost:3000${urlLocale ? `/${urlLocale}` : ""}${path}`;
  return new NextRequest(url, { headers: cookie ? { cookie } : {} });
}

// Answers each backend call in order; a plain object is a GraphQL answer, an Error is a network failure.
function mockBackend(...answers: ({ body: unknown; setCookies?: string[] } | Error)[]) {
  const queue = [...answers];
  const fetchMock = vi.fn().mockImplementation(() => {
    const answer = queue.shift();
    if (!answer) throw new Error("Unexpected backend call");
    if (answer instanceof Error) return Promise.reject(answer);
    const headers = new Headers();
    for (const cookie of answer.setCookies ?? []) headers.append("set-cookie", cookie);
    return Promise.resolve(new Response(JSON.stringify(answer.body), { headers }));
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const location = (response: Response) => response.headers.get("location");
const isRedirect = (response: Response) => response.status === 307 || response.status === 308;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("handleRequest", () => {
  it("lets a public route through without calling the backend", async () => {
    const fetchMock = mockBackend();

    const response = await proxy(requestFor("/forgot-password"));

    expect(isRedirect(response)).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("redirects a visitor without a session from a protected route to sign-in", async () => {
    mockBackend();

    const response = await proxy(requestFor("/users"));

    expect(location(response)).toBe("http://localhost:3000/en/sign-in");
  });

  it("lets a visitor without a session open the sign-in page", async () => {
    mockBackend();

    const response = await proxy(requestFor("/sign-in"));

    expect(isRedirect(response)).toBe(false);
  });

  it("lets a signed-in user open a protected route", async () => {
    const fetchMock = mockBackend();

    const response = await proxy(requestFor("/cvs", { access: FRESH, refresh: "r" }));

    expect(isRedirect(response)).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(["/sign-in", "/sign-up"])(
    "redirects a signed-in user from %s to /en/users",
    async (path) => {
      mockBackend();

      const response = await proxy(requestFor(path, { access: FRESH, refresh: "r" }));

      expect(location(response)).toBe("http://localhost:3000/en/users");
    },
  );

  it("refreshes an expired access token before the page renders and passes the new cookies to the browser", async () => {
    const newCookies = ["access_token=new; Path=/; HttpOnly", "refresh_token=r2; Path=/; HttpOnly"];
    mockBackend({ body: { data: { refresh: true } }, setCookies: newCookies });

    const response = await proxy(requestFor("/users", { access: EXPIRED, refresh: "r1" }));

    expect(isRedirect(response)).toBe(false);
    expect(response.headers.getSetCookie()).toEqual(newCookies);
  });

  it("sends the page the refreshed cookies", async () => {
    mockBackend({
      body: { data: { refresh: true } },
      setCookies: ["access_token=new; Path=/", "refresh_token=r2; Path=/"],
    });
    const request = requestFor("/users", { access: EXPIRED, refresh: "r1" });

    await proxy(request);

    expect(request.cookies.get("access_token")?.value).toBe("new");
    expect(request.cookies.get("refresh_token")?.value).toBe("r2");
  });

  it("forwards the refreshed cookies to the page through next-intl's response", async () => {
    mockBackend({
      body: { data: { refresh: true } },
      setCookies: ["access_token=new; Path=/", "refresh_token=r2; Path=/"],
    });

    const response = await proxy(requestFor("/users", { access: EXPIRED, refresh: "r1" }));

    expect(response.headers.get("x-middleware-request-cookie")).toContain("access_token=new");
  });

  it("redirects to sign-in and clears the cookies when the refresh is rejected", async () => {
    const cleared = ["access_token=; Path=/", "refresh_token=; Path=/"];
    mockBackend({
      body: { data: null, errors: [{ extensions: { code: "UNAUTHENTICATED" } }] },
      setCookies: cleared,
    });

    const response = await proxy(requestFor("/users", { access: EXPIRED, refresh: "dead" }));

    expect(location(response)).toBe("http://localhost:3000/en/sign-in");
    expect(response.headers.getSetCookie()).toEqual(cleared);
  });

  it("does not sign the user out when the backend cannot be reached", async () => {
    mockBackend(new TypeError("fetch failed"));

    const response = await proxy(requestFor("/users", { access: EXPIRED, refresh: "r1" }));

    expect(isRedirect(response)).toBe(false);
    expect(response.headers.getSetCookie()).toEqual([]);
  });

  it("still passes on the cookies a refresh issued when the role request then fails", async () => {
    const newCookies = ["access_token=new; Path=/", "refresh_token=r2; Path=/"];
    mockBackend(
      { body: { data: { refresh: true } }, setCookies: newCookies },
      new TypeError("fetch failed"),
    );

    const response = await proxy(requestFor("/admin/skills", { access: EXPIRED, refresh: "r1" }));

    expect(isRedirect(response)).toBe(false);
    expect(response.headers.getSetCookie()).toEqual(newCookies);
  });

  it("redirects to sign-in and clears the cookies when the backend refuses a fresh-looking token", async () => {
    mockBackend({ body: { data: null, errors: [{ extensions: { code: "UNAUTHENTICATED" } }] } });
    const request = requestFor("/admin/skills", { access: FRESH, refresh: "r" });

    const response = await proxy(request);

    expect(location(response)).toBe("http://localhost:3000/en/sign-in");
    expect(response.headers.getSetCookie()).toHaveLength(2);
    expect(request.cookies.get("access_token")).toBeUndefined();
  });

  it("marks the cleared cookies Secure when a proxy forwards an HTTPS request", async () => {
    mockBackend({ body: { data: null, errors: [{ extensions: { code: "UNAUTHENTICATED" } }] } });
    const request = new NextRequest("http://localhost:3000/en/admin/skills", {
      headers: {
        cookie: `locale=en; access_token=${FRESH}; refresh_token=r`,
        "x-forwarded-proto": "https",
      },
    });

    const response = await proxy(request);

    for (const header of response.headers.getSetCookie()) expect(header).toContain("; Secure");
  });

  it("blocks a user from an admin-only route", async () => {
    mockBackend({ body: { data: { me: { role: "USER" } } } });

    const response = await proxy(requestFor("/admin/skills", { access: FRESH, refresh: "r" }));

    expect(location(response)).toBe("http://localhost:3000/en/users");
  });

  it("lets an admin open an admin-only route", async () => {
    mockBackend({ body: { data: { me: { role: "ADMIN" } } } });

    const response = await proxy(requestFor("/admin/skills", { access: FRESH, refresh: "r" }));

    expect(isRedirect(response)).toBe(false);
  });

  it("blocks a user from the CVs tab of another user's page", async () => {
    mockBackend({ body: { data: { me: { role: "USER" } } } });

    const response = await proxy(requestFor("/users/42/cvs", { access: FRESH, refresh: "r" }));

    expect(location(response)).toBe("http://localhost:3000/en/users");
  });

  describe("language", () => {
    it("adds the saved language to a path without one, before any session check", async () => {
      const fetchMock = mockBackend();

      const response = await proxy(requestFor("/users", { locale: "pl" }, null));

      expect(location(response)).toBe("http://localhost:3000/pl/users");
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("adds English to a path without a language when nothing is saved", async () => {
      mockBackend();

      const response = await proxy(requestFor("/users", { locale: "" }, null));

      expect(location(response)).toBe("http://localhost:3000/en/users");
    });

    it("keeps the language when the session rules redirect", async () => {
      mockBackend();

      const response = await proxy(requestFor("/users", { locale: "pl" }, "pl"));

      expect(location(response)).toBe("http://localhost:3000/pl/sign-in");
    });

    it("saves the language of the URL in the locale cookie when the session rules redirect", async () => {
      mockBackend();

      const response = await proxy(requestFor("/users", { locale: "en" }, "pl"));

      expect(location(response)).toBe("http://localhost:3000/pl/sign-in");
      expect(response.headers.getSetCookie()).toEqual([expect.stringMatching(/^locale=pl;/)]);
    });

    it("saves the language of the URL in the locale cookie", async () => {
      mockBackend();

      const response = await proxy(requestFor("/forgot-password", { locale: "en" }, "pl"));

      expect(response.headers.getSetCookie()).toEqual([expect.stringMatching(/^locale=pl;/)]);
    });
  });

  it("redirects a visitor without a session from an admin-only route to sign-in", async () => {
    mockBackend();

    const response = await proxy(requestFor("/admin/skills"));

    expect(location(response)).toBe("http://localhost:3000/en/sign-in");
  });
});
