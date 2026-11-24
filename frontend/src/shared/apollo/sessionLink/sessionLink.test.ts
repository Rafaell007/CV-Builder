import { ApolloClient, ApolloLink, InMemoryCache } from "@apollo/client";
import { of, throwError } from "rxjs";
import { describe, expect, it, vi } from "vitest";
import { HealthDocument, RefreshDocument } from "@/shared/graphql";
import type { RefreshOutcome } from "@/shared/session";
import { createSessionLink } from "./sessionLink";

const UNAUTHENTICATED = {
  errors: [{ message: "Not signed in", extensions: { code: "UNAUTHENTICATED" } }],
};
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

function setup(outcome: RefreshOutcome, ...results: unknown[]) {
  const refresh = vi.fn().mockResolvedValue(outcome);
  // The redirect is not under way by default, so a test that ends the session still gets the error.
  const onSessionEnded = vi.fn(() => false);
  const backend = backendAnswering(...results);
  const client = new ApolloClient({
    cache: new InMemoryCache(),
    link: ApolloLink.from([createSessionLink({ refresh, onSessionEnded }), backend.link]),
  });
  return { client, refresh, onSessionEnded, backendCalls: backend.calls };
}

describe("createSessionLink", () => {
  it("does nothing when the operation succeeds", async () => {
    const { client, refresh, onSessionEnded } = setup("refreshed", HEALTH_OK);

    await client.query({ query: HealthDocument });

    expect(refresh).not.toHaveBeenCalled();
    expect(onSessionEnded).not.toHaveBeenCalled();
  });

  it("refreshes the session and runs the operation again, so the caller gets the data", async () => {
    const { client, refresh, onSessionEnded, backendCalls } = setup(
      "refreshed",
      UNAUTHENTICATED,
      HEALTH_OK,
    );

    const { data } = await client.query({ query: HealthDocument });

    expect(data?.health.status).toBe("ok");
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(backendCalls).toHaveBeenCalledTimes(2);
    expect(onSessionEnded).not.toHaveBeenCalled();
  });

  it("runs the operation only once more and then ends the session when it fails the same way", async () => {
    const { client, refresh, onSessionEnded, backendCalls } = setup(
      "refreshed",
      UNAUTHENTICATED,
      UNAUTHENTICATED,
      UNAUTHENTICATED,
    );

    await client.query({ query: HealthDocument, errorPolicy: "all" });

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(backendCalls).toHaveBeenCalledTimes(2);
    expect(onSessionEnded).toHaveBeenCalledTimes(1);
  });

  it("keeps the request pending while the redirect to sign-in is under way, after a second failure", async () => {
    const { client, onSessionEnded } = setup("refreshed", UNAUTHENTICATED, UNAUTHENTICATED);
    onSessionEnded.mockReturnValue(true);
    const settled = vi.fn();

    void client.query({ query: HealthDocument, errorPolicy: "all" }).then(settled, settled);
    await vi.waitFor(() => expect(onSessionEnded).toHaveBeenCalledTimes(1));
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(settled).not.toHaveBeenCalled();
  });

  it("keeps the request pending while the redirect to sign-in is under way, after a refused refresh", async () => {
    const { client, onSessionEnded } = setup("rejected", UNAUTHENTICATED);
    onSessionEnded.mockReturnValue(true);
    const settled = vi.fn();

    void client.query({ query: HealthDocument }).then(settled, settled);
    await vi.waitFor(() => expect(onSessionEnded).toHaveBeenCalledTimes(1));
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(settled).not.toHaveBeenCalled();
  });

  it("ends the session when the refresh is refused and passes the error on", async () => {
    const { client, onSessionEnded, backendCalls } = setup("rejected", UNAUTHENTICATED);

    await expect(client.query({ query: HealthDocument })).rejects.toThrow("Not signed in");

    expect(backendCalls).toHaveBeenCalledTimes(1);
    expect(onSessionEnded).toHaveBeenCalledTimes(1);
  });

  it("keeps the session when the refresh fails for another reason, and passes the error on", async () => {
    const { client, onSessionEnded } = setup("failed", UNAUTHENTICATED);

    await expect(client.query({ query: HealthDocument })).rejects.toThrow("Not signed in");

    expect(onSessionEnded).not.toHaveBeenCalled();
  });

  it("ignores errors with another code", async () => {
    const { client, refresh, onSessionEnded } = setup("refreshed", {
      errors: [{ message: "Nope", extensions: { code: "FORBIDDEN" } }],
    });

    await client.query({ query: HealthDocument, errorPolicy: "all" });

    expect(refresh).not.toHaveBeenCalled();
    expect(onSessionEnded).not.toHaveBeenCalled();
  });

  it("ignores network errors", async () => {
    const { client, refresh, onSessionEnded } = setup("refreshed", new Error("Failed to fetch"));

    await client.query({ query: HealthDocument, errorPolicy: "all" });

    expect(refresh).not.toHaveBeenCalled();
    expect(onSessionEnded).not.toHaveBeenCalled();
  });

  it("does not refresh for the refresh operation itself", async () => {
    const { client, refresh, onSessionEnded } = setup("refreshed", UNAUTHENTICATED);

    await client.mutate({ mutation: RefreshDocument, errorPolicy: "all" });

    expect(refresh).not.toHaveBeenCalled();
    expect(onSessionEnded).not.toHaveBeenCalled();
  });
});
