import { ApolloClient, ApolloLink, InMemoryCache } from "@apollo/client";
import { of } from "rxjs";
import { describe, expect, it } from "vitest";
import { HealthDocument } from "@/shared/graphql";
import { createCookieLink } from "./cookieLink";

// Runs the health query through the link and returns the headers the backend would receive.
async function sentHeaders(cookieHeader: string, headers?: Record<string, string>) {
  let received: Record<string, string> | undefined;
  const backend = new ApolloLink((operation) => {
    received = operation.getContext().headers;
    return of({ data: { health: { __typename: "Health", status: "ok" } } });
  });
  const client = new ApolloClient({
    cache: new InMemoryCache(),
    link: ApolloLink.from([createCookieLink(async () => cookieHeader), backend]),
  });

  await client.query({ query: HealthDocument, context: { headers } });
  return received;
}

describe("createCookieLink", () => {
  it("forwards the incoming cookies", async () => {
    expect(await sentHeaders("access_token=a; refresh_token=r")).toEqual({
      cookie: "access_token=a; refresh_token=r",
    });
  });

  it("keeps the headers that are already set", async () => {
    expect(await sentHeaders("access_token=a", { "x-request-id": "1" })).toEqual({
      "x-request-id": "1",
      cookie: "access_token=a",
    });
  });

  it("adds no cookie header when the request has no cookies", async () => {
    expect(await sentHeaders("")).toBeUndefined();
  });
});
