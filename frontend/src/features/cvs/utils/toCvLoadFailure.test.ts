import { CombinedGraphQLErrors } from "@apollo/client";
import { describe, expect, it } from "vitest";
import { toCvLoadFailure } from "./toCvLoadFailure";

const graphQlErrors = (...codes: string[]) =>
  new CombinedGraphQLErrors({
    errors: codes.map((code) => ({ message: "x", extensions: { code } })),
  });
const graphQlError = (code: string) => graphQlErrors(code);

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

  it("reads every error of the response, not only the first one", () => {
    expect(toCvLoadFailure(graphQlErrors("INTERNAL_SERVER_ERROR", "NOT_FOUND"))).toBe("notFound");
    expect(toCvLoadFailure(graphQlErrors("INTERNAL_SERVER_ERROR", "FORBIDDEN"))).toBe("forbidden");
  });

  it("reads notFound before forbidden when the response has both, so it does not show which ids exist", () => {
    expect(toCvLoadFailure(graphQlErrors("FORBIDDEN", "NOT_FOUND"))).toBe("notFound");
    expect(toCvLoadFailure(graphQlErrors("NOT_FOUND", "FORBIDDEN"))).toBe("notFound");
  });

  it("reads a network error as failed", () => {
    expect(toCvLoadFailure(new Error("Failed to fetch"))).toBe("failed");
  });
});
