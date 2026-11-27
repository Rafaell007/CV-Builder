import { describe, expect, it } from "vitest";
import { languageFormSchema, normalizeIso } from "./languages.utils";

const schema = languageFormSchema({
  nameRequired: "name required",
  nameTooLong: "name too long",
  isoRequired: "iso required",
  isoTooLong: "iso too long",
  isoInvalid: "iso invalid",
  nativeNameRequired: "native required",
  nativeNameTooLong: "native too long",
});

const valid = { name: "English", iso: "EN", nativeName: "English" };

/** The first message the schema gives for `field`, or undefined when the field passes. */
function errorOf(values: typeof valid, field: keyof typeof valid) {
  const result = schema.safeParse(values);
  return result.error?.issues.find((issue) => issue.path[0] === field)?.message;
}

describe("normalizeIso", () => {
  it("trims and uppercases", () => {
    expect(normalizeIso(" pt-br ")).toBe("PT-BR");
  });

  // Like the backend: full uppercasing would turn "ß" into "SS", a valid code.
  it.each(["ß", "ı", "é"])("leaves %j as it is (only a-z are uppercased)", (letter) => {
    expect(normalizeIso(letter)).toBe(letter);
  });
});

describe("languageFormSchema", () => {
  it("returns the trimmed values with an uppercase ISO code", () => {
    expect(schema.parse({ name: " German ", iso: " de ", nativeName: " Deutsch " })).toEqual({
      name: "German",
      iso: "DE",
      nativeName: "Deutsch",
    });
  });

  it("requires all three fields; spaces count as empty", () => {
    const empty = { name: " ", iso: " ", nativeName: " " };
    expect(errorOf(empty, "name")).toBe("name required");
    expect(errorOf(empty, "iso")).toBe("iso required");
    expect(errorOf(empty, "nativeName")).toBe("native required");
  });

  it("allows 100 characters in the names and 5 in the ISO code, not more", () => {
    const longest = { name: "a".repeat(100), iso: "PT-BR", nativeName: "b".repeat(100) };
    expect(schema.safeParse(longest).success).toBe(true);

    const tooLong = { name: "a".repeat(101), iso: "ABCDEF", nativeName: "b".repeat(101) };
    expect(errorOf(tooLong, "name")).toBe("name too long");
    expect(errorOf(tooLong, "iso")).toBe("iso too long");
    expect(errorOf(tooLong, "nativeName")).toBe("native too long");
  });

  it.each(["E1", "E N", "-EN", "EN-", "A-B-C", "ÉN", "ß", "ı"])(
    "refuses the ISO code %j",
    (iso) => {
      expect(errorOf({ ...valid, iso }, "iso")).toBe("iso invalid");
    },
  );

  it.each(["EN", "en", "PT-BR", "zh-cn"])("accepts the ISO code %j", (iso) => {
    expect(errorOf({ ...valid, iso }, "iso")).toBeUndefined();
  });
});
