import { CombinedGraphQLErrors } from "@apollo/client";
import { describe, expect, it } from "vitest";
import { isIsoTaken, languageFormSchema, normalizeIso } from "./languages.utils";

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

const refused = (extensions: Record<string, unknown>) =>
  new CombinedGraphQLErrors({ errors: [{ message: "Refused", extensions }] });

describe("normalizeIso", () => {
  it("trims and uppercases", () => {
    expect(normalizeIso(" pt-br ")).toBe("PT-BR");
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

  it.each(["E1", "E N", "-EN", "EN-", "A-B-C", "ÉN"])("refuses the ISO code %j", (iso) => {
    expect(errorOf({ ...valid, iso }, "iso")).toBe("iso invalid");
  });

  it.each(["EN", "en", "PT-BR", "zh-cn"])("accepts the ISO code %j", (iso) => {
    expect(errorOf({ ...valid, iso }, "iso")).toBeUndefined();
  });
});

describe("isIsoTaken", () => {
  it("is true only for CONFLICT with reason ISO_TAKEN", () => {
    expect(isIsoTaken(refused({ code: "CONFLICT", reason: "ISO_TAKEN" }))).toBe(true);
    expect(isIsoTaken(refused({ code: "CONFLICT" }))).toBe(false);
    expect(isIsoTaken(refused({ code: "BAD_USER_INPUT", reason: "ISO_TAKEN" }))).toBe(false);
    expect(isIsoTaken(new Error("Failed to fetch"))).toBe(false);
  });
});
