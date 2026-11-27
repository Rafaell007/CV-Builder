import { ApolloClient, ApolloLink, InMemoryCache } from "@apollo/client";
import { of, throwError } from "rxjs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HealthDocument } from "@/shared/graphql";
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

  it.each(["NOT_FOUND", "FORBIDDEN"])("logs %s as a warning, not as an error", async (code) => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const backend = new ApolloLink(() =>
      of({ errors: [{ message: "CV not found", extensions: { code } }] }),
    );

    await queryHealth(backend);

    expect(warn).toHaveBeenCalledWith("[GraphQL] Health: CV not found", code);
    expect(error).not.toHaveBeenCalled();
  });

  it("logs network errors", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const failure = new Error("Failed to fetch");
    const backend = new ApolloLink(() => throwError(() => failure));

    await queryHealth(backend);

    expect(log).toHaveBeenCalledWith("[Network] Health:", failure);
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
