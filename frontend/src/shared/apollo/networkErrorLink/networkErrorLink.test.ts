import { ApolloClient, ApolloLink, InMemoryCache } from "@apollo/client";
import { ServerError } from "@apollo/client/errors";
import { of, throwError } from "rxjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HealthDocument, RefreshDocument } from "@/shared/graphql";
import { clearQueryFailed, getSnapshot } from "@/shared/network";
import { networkErrorLink } from "./networkErrorLink";

const HEALTH_OK = { data: { health: { __typename: "Health", status: "ok" } } };

// A backend that fails every request with the given error.
const failingWith = (error: Error) => new ApolloLink(() => throwError(() => error));

const serverError = (status: number) =>
  new ServerError("Response not successful", {
    response: new Response("", { status }),
    bodyText: "",
  });

function makeClient(backend: ApolloLink) {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: ApolloLink.from([networkErrorLink, backend]),
  });
}

const queryHealth = (backend: ApolloLink) =>
  makeClient(backend).query({ query: HealthDocument, errorPolicy: "all" });

beforeEach(() => {
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
});

afterEach(() => {
  clearQueryFailed();
  vi.restoreAllMocks();
});

describe("networkErrorLink", () => {
  it("marks the query as failed when fetch itself fails", async () => {
    await queryHealth(failingWith(new TypeError("Failed to fetch")));

    expect(getSnapshot()).toBe("queryFailed");
  });

  it("marks the query as failed when the server answers with a 5xx status", async () => {
    await queryHealth(failingWith(serverError(502)));

    expect(getSnapshot()).toBe("queryFailed");
  });

  it("ignores a 4xx status: the request reached the server", async () => {
    await queryHealth(failingWith(serverError(400)));

    expect(getSnapshot()).toBe("online");
  });

  it("ignores GraphQL errors: the server answered", async () => {
    await queryHealth(new ApolloLink(() => of({ errors: [{ message: "Not found" }] })));

    expect(getSnapshot()).toBe("online");
  });

  it("ignores failed mutations, which keep their error toast", async () => {
    await makeClient(failingWith(new TypeError("Failed to fetch")))
      .mutate({ mutation: RefreshDocument, errorPolicy: "all" })
      .catch(() => {});

    expect(getSnapshot()).toBe("online");
  });

  it("does nothing when the query succeeds", async () => {
    await queryHealth(new ApolloLink(() => of(HEALTH_OK)));

    expect(getSnapshot()).toBe("online");
  });
});
