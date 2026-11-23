import { describe, expect, it } from "vitest";
import { catalogNameSchema } from "./catalogs.utils";

const schema = catalogNameSchema({ nameRequired: "required", nameTooLong: "too long" });

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
