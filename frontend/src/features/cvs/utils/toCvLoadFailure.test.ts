import { CombinedGraphQLErrors } from "@apollo/client";
import { describe, expect, it } from "vitest";
import { toCvLoadFailure } from "./toCvLoadFailure";

const graphQlError = (code: string) =>
  new CombinedGraphQLErrors({ errors: [{ message: "x", extensions: { code } }] });

describe("toCvLoadFailure", () => {
  it("reads NOT_FOUND as notFound", () => {
    expect(toCvLoadFailure(graphQlError("NOT_FOUND"))).toBe("notFound");
  });

  it("reads FORBIDDEN as forbidden", () => {
    expect(toCvLoadFailure(graphQlError("FORBIDDEN"))).toBe("forbidden");
  });

  it("reads any other GraphQL code as failed", () => {
    expect(toCvLoadFailure(graphQlError("INTERNAL_SERVER_ERROR"))).toBe("failed");
  });

  it("reads a network error as failed", () => {
    expect(toCvLoadFailure(new Error("Failed to fetch"))).toBe("failed");
  });
});
