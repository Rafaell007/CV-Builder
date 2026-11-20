import { CombinedGraphQLErrors } from "@apollo/client";
import { describe, expect, it } from "vitest";
import { toDeleteCvFailure } from "./toDeleteCvFailure";

describe("toDeleteCvFailure", () => {
  const graphQlError = (code: string, message: string) =>
    new CombinedGraphQLErrors({ errors: [{ message, extensions: { code } }] });
  const graphQlErrors = (...codes: string[]) =>
    new CombinedGraphQLErrors({
      errors: codes.map((code) => ({ message: "x", extensions: { code } })),
    });

  it("returns notFound for a NOT_FOUND error", () => {
    expect(toDeleteCvFailure(graphQlError("NOT_FOUND", "CV not found"))).toBe("notFound");
  });

  it("returns forbidden for a FORBIDDEN error, separate from notFound", () => {
    expect(toDeleteCvFailure(graphQlError("FORBIDDEN", "No access"))).toBe("forbidden");
  });

  it("returns nothing for another GraphQL error, so the caller shows a friendly text", () => {
    expect(toDeleteCvFailure(graphQlError("INTERNAL_SERVER_ERROR", "Boom"))).toBeUndefined();
  });

  it("reads every error of the response, not only the first one", () => {
    expect(toDeleteCvFailure(graphQlErrors("INTERNAL_SERVER_ERROR", "NOT_FOUND"))).toBe("notFound");
    expect(toDeleteCvFailure(graphQlErrors("INTERNAL_SERVER_ERROR", "FORBIDDEN"))).toBe(
      "forbidden",
    );
  });

  it("returns notFound before forbidden when the response has both, so it does not show which ids exist", () => {
    expect(toDeleteCvFailure(graphQlErrors("FORBIDDEN", "NOT_FOUND"))).toBe("notFound");
    expect(toDeleteCvFailure(graphQlErrors("NOT_FOUND", "FORBIDDEN"))).toBe("notFound");
  });

  it("returns nothing for a network error", () => {
    expect(toDeleteCvFailure(new Error("Failed to fetch"))).toBeUndefined();
  });
});
