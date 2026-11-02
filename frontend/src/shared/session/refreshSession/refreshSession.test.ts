import { afterEach, describe, expect, it, vi } from "vitest";
import { refreshSession } from "./refreshSession";

function mockBackend(body: unknown) {
  const fetchMock = vi
    .fn()
    .mockImplementation(() => Promise.resolve(new Response(JSON.stringify(body))));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("refreshSession", () => {
  it("posts the refresh mutation to the frontend's own /graphql", async () => {
    const fetchMock = mockBackend({ data: { refresh: true } });

    await refreshSession();

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/graphql");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string).query).toContain("refresh");
  });

  it("reports refreshed when the backend sets new cookies", async () => {
    mockBackend({ data: { refresh: true } });

    expect(await refreshSession()).toBe("refreshed");
  });

  it("reports rejected when the session is over", async () => {
    mockBackend({ data: null, errors: [{ extensions: { code: "UNAUTHENTICATED" } }] });

    expect(await refreshSession()).toBe("rejected");
  });

  it("reports failed on another error", async () => {
    mockBackend({ data: null, errors: [{ extensions: { code: "INTERNAL_SERVER_ERROR" } }] });

    expect(await refreshSession()).toBe("failed");
  });

  it("reports failed when the backend cannot be reached", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    expect(await refreshSession()).toBe("failed");
  });

  it("sends one request for refreshes that run at the same time", async () => {
    const fetchMock = mockBackend({ data: { refresh: true } });

    const outcomes = await Promise.all([refreshSession(), refreshSession(), refreshSession()]);

    expect(outcomes).toEqual(["refreshed", "refreshed", "refreshed"]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("sends a new request for a refresh after the last one finished", async () => {
    const fetchMock = mockBackend({ data: { refresh: true } });

    await refreshSession();
    await refreshSession();

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
