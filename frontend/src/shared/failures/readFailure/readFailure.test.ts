import { CombinedGraphQLErrors } from "@apollo/client";
import { describe, expect, it } from "vitest";
import { readFailure } from "./readFailure";

function graphQlError(code: string, reason?: string): CombinedGraphQLErrors {
  return new CombinedGraphQLErrors({
    errors: [{ message: code, extensions: { code, ...(reason ? { reason } : {}) } }],
  });
}

function graphQlErrors(...codes: string[]): CombinedGraphQLErrors {
  return new CombinedGraphQLErrors({
    errors: codes.map((code) => ({ message: code, extensions: { code } })),
  });
}

describe("readFailure", () => {
  it.each([
    ["NOT_FOUND", "notFound"],
    ["FORBIDDEN", "forbidden"],
    ["CONFLICT", "conflict"],
    ["BAD_USER_INPUT", "invalid"],
    ["UNAUTHENTICATED", "unauthenticated"],
    ["TOO_MANY_REQUESTS", "tooManyRequests"],
  ] as const)("reads %s as %s", (code, kind) => {
    expect(readFailure(graphQlError(code))).toEqual({ kind });
  });

  it("returns unknown for a code the user cannot act on", () => {
    expect(readFailure(graphQlError("INTERNAL_SERVER_ERROR"))).toEqual({ kind: "unknown" });
  });

  it("returns unknown for an error without a code", () => {
    const error = new CombinedGraphQLErrors({ errors: [{ message: "x" }] });

    expect(readFailure(error)).toEqual({ kind: "unknown" });
  });

  it("returns unknown for a network error and for a value that is not an error", () => {
    expect(readFailure(new Error("Failed to fetch"))).toEqual({ kind: "unknown" });
    expect(readFailure(undefined)).toEqual({ kind: "unknown" });
  });

  it("reads every error of the response, not only the first one", () => {
    expect(readFailure(graphQlErrors("INTERNAL_SERVER_ERROR", "FORBIDDEN"))).toEqual({
      kind: "forbidden",
    });
  });

  it("returns notFound before every other code, so it does not show which ids exist", () => {
    expect(readFailure(graphQlErrors("FORBIDDEN", "NOT_FOUND"))).toEqual({ kind: "notFound" });
    expect(readFailure(graphQlErrors("NOT_FOUND", "FORBIDDEN"))).toEqual({ kind: "notFound" });
    expect(readFailure(graphQlErrors("CONFLICT", "NOT_FOUND"))).toEqual({ kind: "notFound" });
  });

  it("keeps the order forbidden, conflict, invalid when notFound is not there", () => {
    expect(readFailure(graphQlErrors("CONFLICT", "FORBIDDEN"))).toEqual({ kind: "forbidden" });
    expect(readFailure(graphQlErrors("BAD_USER_INPUT", "CONFLICT"))).toEqual({ kind: "conflict" });
  });

  it("puts unauthenticated and tooManyRequests after the codes of the service", () => {
    expect(readFailure(graphQlErrors("TOO_MANY_REQUESTS", "BAD_USER_INPUT"))).toEqual({
      kind: "invalid",
    });
    expect(readFailure(graphQlErrors("UNAUTHENTICATED", "BAD_USER_INPUT"))).toEqual({
      kind: "invalid",
    });
    expect(readFailure(graphQlErrors("TOO_MANY_REQUESTS", "UNAUTHENTICATED"))).toEqual({
      kind: "unauthenticated",
    });
  });

  it("keeps the reason of a throttled request", () => {
    expect(readFailure(graphQlError("TOO_MANY_REQUESTS", "RESEND_COOLDOWN"))).toEqual({
      kind: "tooManyRequests",
      reason: "RESEND_COOLDOWN",
    });
  });

  it("returns the backend reason of the error that decided the kind", () => {
    expect(readFailure(graphQlError("CONFLICT", "ISO_TAKEN"))).toEqual({
      kind: "conflict",
      reason: "ISO_TAKEN",
    });
  });

  it("leaves the reason out when the error has none, or when it is not text", () => {
    const error = new CombinedGraphQLErrors({
      errors: [{ message: "x", extensions: { code: "CONFLICT", reason: 7 } }],
    });

    expect(readFailure(graphQlError("CONFLICT"))).toEqual({ kind: "conflict" });
    expect(readFailure(error)).toEqual({ kind: "conflict" });
  });

  it("ignores the reason of an error that did not decide the kind", () => {
    const error = new CombinedGraphQLErrors({
      errors: [
        { message: "a", extensions: { code: "BAD_USER_INPUT", reason: "OTHER" } },
        { message: "b", extensions: { code: "CONFLICT", reason: "ISO_TAKEN" } },
      ],
    });

    expect(readFailure(error)).toEqual({ kind: "conflict", reason: "ISO_TAKEN" });
  });
});
