import { describe, expect, it } from "vitest";
import { databasesCategory, frontendCategory } from "../skills.mocks";
import { categoryOptions, skillFormSchema } from "./skills.utils";

const schema = skillFormSchema({
  nameRequired: "name required",
  nameTooLong: "too long",
  categoryRequired: "category required",
});

describe("skillFormSchema", () => {
  it("returns the trimmed name and the category", () => {
    expect(schema.parse({ name: "  React  ", categoryId: "c1" })).toEqual({
      name: "React",
      categoryId: "c1",
    });
  });

  it("rejects a name of spaces", () => {
    expect(schema.safeParse({ name: "   ", categoryId: "c1" }).error?.issues[0]?.message).toBe(
      "name required",
    );
  });

  it("rejects a name over 100 characters", () => {
    expect(
      schema.safeParse({ name: "a".repeat(101), categoryId: "c1" }).error?.issues[0]?.message,
    ).toBe("too long");
  });

  it("rejects a form without a category", () => {
    expect(schema.safeParse({ name: "React", categoryId: "" }).error?.issues[0]?.message).toBe(
      "category required",
    );
  });
});

describe("categoryOptions", () => {
  it("turns the loaded categories into options", () => {
    expect(categoryOptions([databasesCategory, frontendCategory])).toEqual([
      { value: "c2", label: "Databases" },
      { value: "c1", label: "Frontend" },
    ]);
  });

  it("adds the current category while the categories are not loaded", () => {
    expect(categoryOptions(undefined, frontendCategory)).toEqual([
      { value: "c1", label: "Frontend" },
    ]);
  });

  it("does not add the current category twice", () => {
    expect(categoryOptions([frontendCategory], frontendCategory)).toEqual([
      { value: "c1", label: "Frontend" },
    ]);
  });
});
