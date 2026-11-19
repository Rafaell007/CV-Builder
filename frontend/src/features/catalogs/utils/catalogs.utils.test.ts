import { CombinedGraphQLErrors } from "@apollo/client";
import { describe, expect, it } from "vitest";
import { catalogNameSchema, isCatalogConflict } from "./catalogs.utils";

const schema = catalogNameSchema({ nameRequired: "required", nameTooLong: "too long" });

const graphQLError = (code: string) =>
  new CombinedGraphQLErrors({ errors: [{ message: "Refused", extensions: { code } }] });

describe("catalogNameSchema", () => {
  it("returns the trimmed name", () => {
    expect(schema.parse({ name: "  Engineering  " })).toEqual({ name: "Engineering" });
  });

  it("rejects an empty name and a name of spaces", () => {
    expect(schema.safeParse({ name: "" }).error?.issues[0]?.message).toBe("required");
    expect(schema.safeParse({ name: "   " }).error?.issues[0]?.message).toBe("required");
  });

  it("allows 100 characters and rejects 101", () => {
    expect(schema.safeParse({ name: "a".repeat(100) }).success).toBe(true);
    expect(schema.safeParse({ name: "a".repeat(101) }).error?.issues[0]?.message).toBe("too long");
  });
});

describe("isCatalogConflict", () => {
  it("is true for a CONFLICT error", () => {
    expect(isCatalogConflict(graphQLError("CONFLICT"))).toBe(true);
  });

  it("is false for another code, a network error and a value that is not an error", () => {
    expect(isCatalogConflict(graphQLError("FORBIDDEN"))).toBe(false);
    expect(isCatalogConflict(new Error("Failed to fetch"))).toBe(false);
    expect(isCatalogConflict(undefined)).toBe(false);
  });
});
