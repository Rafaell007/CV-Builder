import type { ApolloClient } from "@apollo/client-integration-nextjs";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { env } from "@/env";
import { HealthDocument } from "@/shared/graphql";
import { render, screen } from "@/shared/testing";
import { ApolloClientProvider } from "./ApolloClientProvider";

const captured = vi.hoisted(() => ({ makeClient: undefined as undefined | (() => unknown) }));

// The provider keeps the client factory; the test calls it to look at the client it builds.
vi.mock(import("@apollo/client-integration-nextjs"), async (importOriginal) => ({
  ...(await importOriginal()),
  ApolloNextAppProvider: (({
    makeClient,
    children,
  }: {
    makeClient: () => unknown;
    children: ReactNode;
  }) => {
    captured.makeClient = makeClient;
    return children;
  }) as unknown as (typeof import("@apollo/client-integration-nextjs"))["ApolloNextAppProvider"],
}));

const fetchMock = vi.fn(() =>
  Promise.resolve(
    new Response(JSON.stringify({ data: { health: { __typename: "Health", status: "ok" } } }), {
      headers: { "content-type": "application/json" },
    }),
  ),
);

// Plain render, not renderWithProviders: that helper wraps the UI in its own Apollo provider, and this
// test is about the real one.
describe("ApolloClientProvider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockClear();
  });

  it("shows its children", () => {
    render(
      <ApolloClientProvider>
        <p>page</p>
      </ApolloClientProvider>,
    );

    expect(screen.getByText("page")).toBeInTheDocument();
  });

  it("builds a client that sends its queries to the frontend /graphql", async () => {
    vi.stubGlobal("fetch", fetchMock);
    render(
      <ApolloClientProvider>
        <p>page</p>
      </ApolloClientProvider>,
    );
    const client = captured.makeClient?.() as ApolloClient;

    const result = await client.query({ query: HealthDocument });

    expect(result.data?.health.status).toBe("ok");
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]).toEqual([`${env.appUrl}/graphql`, expect.anything()]);
  });
});
