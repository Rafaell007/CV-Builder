import { CombinedGraphQLErrors } from "@apollo/client";
import { describe, expect, it } from "vitest";
import { toDeleteProjectFailure } from "./projects.utils";

describe("toDeleteProjectFailure", () => {
  const graphQlError = (code: string, message: string) =>
    new CombinedGraphQLErrors({ errors: [{ message, extensions: { code } }] });

  it("returns inUse for a CONFLICT error (a CV uses the project)", () => {
    const error = graphQlError("CONFLICT", "The project is used in 2 CVs");

    expect(toDeleteProjectFailure(error)).toBe("inUse");
  });

  it("returns nothing for another GraphQL error, so the caller shows a friendly text", () => {
    expect(toDeleteProjectFailure(graphQlError("INTERNAL_SERVER_ERROR", "Boom"))).toBeUndefined();
  });

  it("returns nothing for a network error", () => {
    expect(toDeleteProjectFailure(new Error("Failed to fetch"))).toBeUndefined();
  });
});
