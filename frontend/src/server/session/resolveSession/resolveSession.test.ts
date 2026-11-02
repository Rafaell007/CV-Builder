import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveSession } from "./resolveSession";

const NOW_MS = Date.UTC(2026, 10, 2, 12, 0, 0);

function tokenExpiringAt(expMs: number): string {
  return `h.${btoa(JSON.stringify({ exp: Math.floor(expMs / 1000) }))}.s`;
}

const FRESH = tokenExpiringAt(NOW_MS + 10 * 60_000);
const EXPIRED = tokenExpiringAt(NOW_MS - 60_000);

type Answer = { body: unknown; setCookies?: string[] } | Error;

// Answers the backend calls in order and returns the cookie header and operation of each call.
function mockBackend(...answers: Answer[]) {
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

function calls(fetchMock: ReturnType<typeof vi.fn>) {
  return fetchMock.mock.calls.map(([, init]) => {
    const { headers, body } = init as { headers: Record<string, string>; body: string };
    return { cookie: headers["cookie"], query: (JSON.parse(body) as { query: string }).query };
  });
}

function resolve(input: { accessToken?: string; refreshToken?: string; needRole?: boolean }) {
  return resolveSession({
    backendUrl: "http://backend",
    accessToken: input.accessToken,
    refreshToken: input.refreshToken,
    needRole: input.needRole ?? false,
    nowMs: NOW_MS,
  });
}

const ADMIN = { data: { me: { role: "ADMIN" } } };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("resolveSession", () => {
  it("has no session without cookies and calls nothing", async () => {
    const fetchMock = mockBackend();

    expect(await resolve({})).toEqual({ status: "none", setCookies: [] });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uses a fresh access token without calling the backend", async () => {
    const fetchMock = mockBackend();

    expect(await resolve({ accessToken: FRESH, refreshToken: "r" })).toEqual({
      status: "active",
      role: null,
      setCookies: [],
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refreshes an expired access token and returns the new cookies", async () => {
    const newCookies = ["access_token=new; Path=/", "refresh_token=r2; Path=/"];
    const fetchMock = mockBackend({ body: { data: { refresh: true } }, setCookies: newCookies });

    const result = await resolve({ accessToken: EXPIRED, refreshToken: "r1" });

    expect(result).toEqual({ status: "active", role: null, setCookies: newCookies });
    expect(calls(fetchMock)).toHaveLength(1);
    expect(calls(fetchMock)[0]?.query).toContain("refresh");
    expect(calls(fetchMock)[0]?.cookie).toBe(`access_token=${EXPIRED}; refresh_token=r1`);
  });

  it("sends one refresh when several requests carry the same refresh token", async () => {
    const newCookies = ["access_token=new; Path=/"];
    const fetchMock = mockBackend({ body: { data: { refresh: true } }, setCookies: newCookies });

    const [first, second] = await Promise.all([
      resolve({ accessToken: EXPIRED, refreshToken: "r1" }),
      resolve({ accessToken: EXPIRED, refreshToken: "r1" }),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(first).toEqual({ status: "active", role: null, setCookies: newCookies });
    expect(second).toEqual(first);
  });

  it("refreshes when only the refresh cookie is left", async () => {
    mockBackend({ body: { data: { refresh: true } }, setCookies: ["access_token=new; Path=/"] });

    const result = await resolve({ refreshToken: "r1" });

    expect(result.status).toBe("active");
  });

  it("ends the session when the refresh is rejected and passes on the clearing cookies", async () => {
    const cleared = ["access_token=; Path=/", "refresh_token=; Path=/"];
    mockBackend({
      body: { data: null, errors: [{ extensions: { code: "UNAUTHENTICATED" } }] },
      setCookies: cleared,
    });

    expect(await resolve({ accessToken: EXPIRED, refreshToken: "dead" })).toEqual({
      status: "none",
      setCookies: cleared,
    });
  });

  it("reports the backend as unavailable when it cannot be reached", async () => {
    mockBackend(new TypeError("fetch failed"));

    expect(await resolve({ accessToken: EXPIRED, refreshToken: "r1" })).toEqual({
      status: "unavailable",
    });
  });

  it("reports the backend as unavailable on an error other than UNAUTHENTICATED", async () => {
    mockBackend({
      body: { data: null, errors: [{ extensions: { code: "INTERNAL_SERVER_ERROR" } }] },
    });

    expect(await resolve({ accessToken: EXPIRED, refreshToken: "r1" })).toEqual({
      status: "unavailable",
    });
  });

  it("reads the role of a fresh session when asked", async () => {
    const fetchMock = mockBackend({ body: ADMIN });

    const result = await resolve({ accessToken: FRESH, refreshToken: "r", needRole: true });

    expect(result).toEqual({ status: "active", role: "ADMIN", setCookies: [] });
    expect(calls(fetchMock)).toHaveLength(1);
    expect(calls(fetchMock)[0]?.cookie).toBe(`access_token=${FRESH}; refresh_token=r`);
  });

  it("asks for the role with the cookies the refresh just issued", async () => {
    const fetchMock = mockBackend(
      {
        body: { data: { refresh: true } },
        setCookies: ["access_token=new; Path=/", "refresh_token=r2; Path=/"],
      },
      { body: { data: { me: { role: "USER" } } } },
    );

    const result = await resolve({ accessToken: EXPIRED, refreshToken: "r1", needRole: true });

    expect(result).toMatchObject({ status: "active", role: "USER" });
    expect(calls(fetchMock)[1]?.cookie).toBe("access_token=new; refresh_token=r2");
  });

  it("has no session when the backend says nobody is signed in", async () => {
    mockBackend({ body: { data: { me: null } } });

    expect(await resolve({ accessToken: FRESH, refreshToken: "r", needRole: true })).toEqual({
      status: "none",
      setCookies: [],
    });
  });

  it("reports the backend as unavailable when the role request fails", async () => {
    mockBackend(new TypeError("fetch failed"));

    expect(await resolve({ accessToken: FRESH, refreshToken: "r", needRole: true })).toEqual({
      status: "unavailable",
    });
  });
});
