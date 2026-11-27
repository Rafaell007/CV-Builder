import { describe, expect, it } from "vitest";
import { validateCode } from "./verify-email.utils";

describe("validateCode", () => {
  it("asks for a code when there is none", () => {
    expect(validateCode("")).toBe("codeRequired");
  });

  it.each(["1", "12345", "1234567", "12345a", "abcdef", "12 456"])(
    "refuses %j: not exactly 6 digits",
    (code) => {
      expect(validateCode(code)).toBe("codeIncomplete");
    },
  );

  it.each(["123456", "000000", "007007"])("accepts %s", (code) => {
    expect(validateCode(code)).toBeUndefined();
  });
});
