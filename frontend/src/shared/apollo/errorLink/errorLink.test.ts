import { ApolloClient, ApolloLink, InMemoryCache } from "@apollo/client";
import { of, throwError } from "rxjs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HealthDocument } from "@/shared/graphql";
import { getNetworkFailed, resetNetworkStatus } from "@/shared/network/store";
import { errorLink } from "./errorLink";

function queryHealth(backend: ApolloLink) {
  const client = new ApolloClient({
    cache: new InMemoryCache(),
    link: ApolloLink.from([errorLink, backend]),
  });
  return client.query({ query: HealthDocument, errorPolicy: "all" });
}

afterEach(() => {
  vi.restoreAllMocks();
  resetNetworkStatus();
});

describe("errorLink", () => {
  it("logs each GraphQL error with its code", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const backend = new ApolloLink(() =>
      of({ errors: [{ message: "Not signed in", extensions: { code: "UNAUTHENTICATED" } }] }),
    );

    await queryHealth(backend);

    expect(log).toHaveBeenCalledWith("[GraphQL] Health: Not signed in", "UNAUTHENTICATED");
  });

  it("logs network errors", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const failure = new Error("Failed to fetch");
    const backend = new ApolloLink(() => throwError(() => failure));

    await queryHealth(backend);

    expect(log).toHaveBeenCalledWith("[Network] Health:", failure);
  });

  it("reports a TypeError from fetch as a lost connection, but not other errors", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    await queryHealth(new ApolloLink(() => throwError(() => new Error("Boom"))));
    expect(getNetworkFailed()).toBe(false);

    await queryHealth(new ApolloLink(() => throwError(() => new TypeError("Failed to fetch"))));
    expect(getNetworkFailed()).toBe(true);
  });

  it("logs nothing when the operation succeeds", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const backend = new ApolloLink(() =>
      of({ data: { health: { __typename: "Health", status: "ok" } } }),
    );

    await queryHealth(backend);

    expect(log).not.toHaveBeenCalled();
  });
});
