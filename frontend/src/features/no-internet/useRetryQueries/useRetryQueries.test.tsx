import { ApolloClient, ApolloLink, InMemoryCache } from "@apollo/client";
import { ApolloProvider } from "@apollo/client/react";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { of, throwError } from "rxjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HealthDocument } from "@/shared/graphql";
import { clearQueryFailed, getSnapshot, markQueryFailed } from "@/shared/network";
import { useRetryQueries } from "./useRetryQueries";

const HEALTH_OK = { data: { health: { __typename: "Health", status: "ok" } } };

// A backend that answers each call to it with the next result, in order.
function backendAnswering(...results: unknown[]) {
  const queue = [...results];
  const handler = vi.fn(() => {
    const next = queue.shift();
    return next instanceof Error ? throwError(() => next) : of(next as ApolloLink.Result);
  });
  return { link: new ApolloLink(handler), calls: handler };
}

// A client with one query on the screen ("active"), as a mounted useQuery would have.
async function setup(...results: unknown[]) {
  const backend = backendAnswering(...results);
  const client = new ApolloClient({ cache: new InMemoryCache(), link: backend.link });
  const subscription = client.watchQuery({ query: HealthDocument }).subscribe(() => {});
  await vi.waitFor(() => expect(backend.calls).toHaveBeenCalledTimes(1));

  const wrapper = ({ children }: { children: ReactNode }) => (
    <ApolloProvider client={client}>{children}</ApolloProvider>
  );
  const retry = renderHook(() => useRetryQueries(), { wrapper }).result.current;
  return { retry, backendCalls: backend.calls, unsubscribe: () => subscription.unsubscribe() };
}

beforeEach(() => {
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
  markQueryFailed();
});

afterEach(() => {
  clearQueryFailed();
  vi.restoreAllMocks();
});

describe("useRetryQueries", () => {
  it("runs the active queries again and clears the failure when they succeed", async () => {
    const { retry, backendCalls, unsubscribe } = await setup(HEALTH_OK, HEALTH_OK);

    retry();

    await vi.waitFor(() => expect(getSnapshot()).toBe("online"));
    expect(backendCalls).toHaveBeenCalledTimes(2);
    unsubscribe();
  });

  it("keeps the failure when a query fails again", async () => {
    const { retry, backendCalls, unsubscribe } = await setup(
      HEALTH_OK,
      new TypeError("Failed to fetch"),
    );

    retry();

    await vi.waitFor(() => expect(backendCalls).toHaveBeenCalledTimes(2));
    // Lets the rejected refetch reach the catch before checking.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(getSnapshot()).toBe("queryFailed");
    unsubscribe();
  });
});
