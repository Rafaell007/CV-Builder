import { ApolloClient, ApolloLink, InMemoryCache } from "@apollo/client";
import { ApolloProvider, createQueryPreloader, useQuery } from "@apollo/client/react";
import { Suspense, type ReactNode } from "react";
import { ReplaySubject } from "rxjs";
import { describe, expect, it, vi } from "vitest";
import { HealthDocument } from "@/shared/graphql";
import { act, render, screen } from "@/shared/testing";
import { WaitForQuery } from "./WaitForQuery";

const HEALTH_OK = { data: { health: { __typename: "Health", status: "ok" } } };
const FAILED = { errors: [{ message: "Down", extensions: { code: "INTERNAL_SERVER_ERROR" } }] };

// Starts the Health query the way PrefetchQuery does (errorPolicy "all") against a backend that answers only when
// the test calls `answer`, and counts the requests it gets.
function preloadHealth() {
  const response = new ReplaySubject<ApolloLink.Result>();
  const requests = vi.fn(() => response);
  const client = new ApolloClient({ cache: new InMemoryCache(), link: new ApolloLink(requests) });
  const queryRef = createQueryPreloader(client)(HealthDocument, { errorPolicy: "all" });
  const answer = (result: ApolloLink.Result) =>
    act(async () => {
      response.next(result);
      response.complete();
    });
  return { client, queryRef, requests, answer };
}

// The page content: it reads the query with its own useQuery, as the list pages do.
function Status() {
  const { data, loading } = useQuery(HealthDocument);
  return <p>{loading ? "loading" : `status ${data?.health.status ?? "none"}`}</p>;
}

// Plain render, not renderWithProviders: that helper brings its own Apollo client, and these tests need one they
// can preload with and whose requests they count.
async function show(client: ApolloClient, content: ReactNode) {
  await act(async () => {
    render(
      <ApolloProvider client={client}>
        <Suspense fallback={<p>waiting</p>}>{content}</Suspense>
      </ApolloProvider>,
    );
  });
}

describe("WaitForQuery", () => {
  it("shows the content only when the result is in the cache, and the content asks nothing again", async () => {
    const { client, queryRef, requests, answer } = preloadHealth();

    await show(
      client,
      <WaitForQuery queryRef={queryRef}>
        <Status />
      </WaitForQuery>,
    );
    expect(screen.getByText("waiting")).toBeInTheDocument();

    await answer(HEALTH_OK);

    expect(await screen.findByText("status ok")).toBeInTheDocument();
    expect(requests).toHaveBeenCalledOnce();
  });

  it("shows the content after a failed request, so the page can show its own error", async () => {
    const { client, queryRef, answer } = preloadHealth();

    await show(
      client,
      <WaitForQuery queryRef={queryRef}>
        <p>content</p>
      </WaitForQuery>,
    );
    await answer(FAILED);

    expect(await screen.findByText("content")).toBeInTheDocument();
  });
});
