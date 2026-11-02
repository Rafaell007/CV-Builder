import { afterEach, describe, expect, it, vi } from "vitest";
import { MeDocument } from "@/shared/graphql";
import { postGraphql } from "./postGraphql";

function mockBackend(body: unknown, setCookies: string[] = []) {
  const headers = new Headers();
  for (const cookie of setCookies) headers.append("set-cookie", cookie);
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { headers }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("postGraphql", () => {
  it("posts the operation with the cookies to the backend", async () => {
    const fetchMock = mockBackend({ data: { me: null } });

    await postGraphql("http://backend", MeDocument, "access_token=a");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://backend/graphql");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({ cookie: "access_token=a" });
    expect(JSON.parse(init.body as string).query).toContain("me");
  });

  it("sends no cookie header when there are no cookies", async () => {
    const fetchMock = mockBackend({ data: { me: null } });

    await postGraphql("http://backend", MeDocument, "");

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.headers).not.toHaveProperty("cookie");
  });

  it("returns the data and the Set-Cookie headers", async () => {
    mockBackend({ data: { me: null } }, ["access_token=n; Path=/", "refresh_token=r; Path=/"]);

    const result = await postGraphql("http://backend", MeDocument, "");

    expect(result).toEqual({
      data: { me: null },
      errorCodes: [],
      setCookies: ["access_token=n; Path=/", "refresh_token=r; Path=/"],
    });
  });

  it("returns the code of each GraphQL error", async () => {
    mockBackend({
      data: null,
      errors: [{ extensions: { code: "UNAUTHENTICATED" } }, { message: "no code" }],
    });

    const result = await postGraphql("http://backend", MeDocument, "");

    expect(result.data).toBeNull();
    expect(result.errorCodes).toEqual(["UNAUTHENTICATED", "UNKNOWN"]);
  });

  it("throws when the backend cannot be reached", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));

    await expect(postGraphql("http://backend", MeDocument, "")).rejects.toThrow("fetch failed");
  });
});
