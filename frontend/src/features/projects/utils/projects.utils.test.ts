import { CombinedGraphQLErrors } from "@apollo/client";
import { describe, expect, it } from "vitest";
import { toDeleteProjectFailure } from "./projects.utils";

describe("toDeleteProjectFailure", () => {
  const graphQlError = (code: string, message: string) =>
    new CombinedGraphQLErrors({ errors: [{ message, extensions: { code } }] });

  it("returns the message of a CONFLICT error, so the user reads the business rule", () => {
    const error = graphQlError("CONFLICT", "The project is used in 2 CVs");

    expect(toDeleteProjectFailure(error)).toBe("The project is used in 2 CVs");
  });

  it("returns nothing for another GraphQL error, so the caller shows a friendly text", () => {
    expect(toDeleteProjectFailure(graphQlError("INTERNAL_SERVER_ERROR", "Boom"))).toBeUndefined();
  });

  it("returns nothing for a network error", () => {
    expect(toDeleteProjectFailure(new Error("Failed to fetch"))).toBeUndefined();
  });
});
