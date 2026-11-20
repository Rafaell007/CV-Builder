import { afterEach, describe, expect, it, vi } from "vitest";
import { HealthDocument } from "@/shared/graphql";
import { getClient } from "./apolloServerClient";

const cookies = vi.hoisted(() => vi.fn());

// The real package throws when it is imported outside a Server Component.
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies }));
vi.mock("@/server/env", () => ({ serverEnv: { backendUrl: "http://backend.test:4000" } }));
// The real function keeps one client per request through React's cache(); here every call builds one.
vi.mock(import("@apollo/client-integration-nextjs"), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    registerApolloClient: ((makeClient: () => unknown) => ({
      getClient: makeClient,
    })) as unknown as typeof actual.registerApolloClient,
  };
});

const fetchMock = vi.fn(() =>
  Promise.resolve(
    new Response(JSON.stringify({ data: { health: { __typename: "Health", status: "ok" } } }), {
      headers: { "content-type": "application/json" },
    }),
  ),
);

describe("server Apollo client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockClear();
  });

  it("calls the backend directly and forwards the cookies of the request", async () => {
    vi.stubGlobal("fetch", fetchMock);
    cookies.mockResolvedValue({ toString: () => "access_token=a; refresh_token=r" });

    const result = await getClient().query({ query: HealthDocument });

    expect(result.data?.health.status).toBe("ok");
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("http://backend.test:4000/graphql");
    expect(init.headers).toMatchObject({ cookie: "access_token=a; refresh_token=r" });
  });
});
