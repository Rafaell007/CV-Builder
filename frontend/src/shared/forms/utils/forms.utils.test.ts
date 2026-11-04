import { CombinedGraphQLErrors } from "@apollo/client";
import { describe, expect, it } from "vitest";
import { getServerFieldErrors } from "./forms.utils";

function graphQLErrors(...extensions: Record<string, unknown>[]): CombinedGraphQLErrors {
  return new CombinedGraphQLErrors({
    errors: extensions.map((item) => ({ message: "failed", extensions: item })),
  });
}

const EMAIL_ERROR = { field: "email", messages: ["email must be an email"] };
const SIZE_ERROR = { field: "page.size", messages: ["size must not be greater than 100"] };

describe("getServerFieldErrors", () => {
  it("returns the field errors of a BAD_USER_INPUT error", () => {
    const error = graphQLErrors({ code: "BAD_USER_INPUT", fieldErrors: [EMAIL_ERROR, SIZE_ERROR] });

    expect(getServerFieldErrors(error)).toEqual([EMAIL_ERROR, SIZE_ERROR]);
  });

  it("collects the field errors of every GraphQL error in the answer", () => {
    const error = graphQLErrors(
      { code: "BAD_USER_INPUT", fieldErrors: [EMAIL_ERROR] },
      { code: "BAD_USER_INPUT", fieldErrors: [SIZE_ERROR] },
    );

    expect(getServerFieldErrors(error)).toEqual([EMAIL_ERROR, SIZE_ERROR]);
  });

  it("ignores errors with another code", () => {
    const error = graphQLErrors(
      { code: "CONFLICT", fieldErrors: [EMAIL_ERROR] },
      { code: "BAD_USER_INPUT", fieldErrors: [SIZE_ERROR] },
    );

    expect(getServerFieldErrors(error)).toEqual([SIZE_ERROR]);
  });

  it("ignores field errors in an unexpected shape", () => {
    expect(getServerFieldErrors(graphQLErrors({ code: "BAD_USER_INPUT" }))).toEqual([]);
    expect(
      getServerFieldErrors(
        graphQLErrors({ code: "BAD_USER_INPUT", fieldErrors: [{ field: "email", messages: "x" }] }),
      ),
    ).toEqual([]);
  });

  it("returns nothing for an error that is not a GraphQL answer", () => {
    expect(getServerFieldErrors(new TypeError("Failed to fetch"))).toEqual([]);
    expect(getServerFieldErrors(undefined)).toEqual([]);
  });
});
