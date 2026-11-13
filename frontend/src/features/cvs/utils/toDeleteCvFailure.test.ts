import { CombinedGraphQLErrors } from "@apollo/client";
import { describe, expect, it } from "vitest";
import { toDeleteCvFailure } from "./toDeleteCvFailure";

describe("toDeleteCvFailure", () => {
  const graphQlError = (code: string, message: string) =>
    new CombinedGraphQLErrors({ errors: [{ message, extensions: { code } }] });

  it("returns notFound for a NOT_FOUND error", () => {
    expect(toDeleteCvFailure(graphQlError("NOT_FOUND", "CV not found"))).toBe("notFound");
  });

  it("returns forbidden for a FORBIDDEN error, separate from notFound", () => {
    expect(toDeleteCvFailure(graphQlError("FORBIDDEN", "No access"))).toBe("forbidden");
  });

  it("returns nothing for another GraphQL error, so the caller shows a friendly text", () => {
    expect(toDeleteCvFailure(graphQlError("INTERNAL_SERVER_ERROR", "Boom"))).toBeUndefined();
  });

  it("returns nothing for a network error", () => {
    expect(toDeleteCvFailure(new Error("Failed to fetch"))).toBeUndefined();
  });
});
