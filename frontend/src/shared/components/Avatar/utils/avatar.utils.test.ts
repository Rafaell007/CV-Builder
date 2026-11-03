import { describe, expect, it } from "vitest";
import { getInitials } from "./avatar.utils";

describe("getInitials", () => {
  it("uses the first letter of the first and the last word", () => {
    expect(getInitials("Jan Kowalski")).toBe("JK");
    expect(getInitials("Anna Maria Nowak")).toBe("AN");
  });

  it("uses one letter for a single word", () => {
    expect(getInitials("madonna")).toBe("M");
  });

  it("ignores extra spaces", () => {
    expect(getInitials("  Jan   Kowalski ")).toBe("JK");
  });

  it("returns an empty string for an empty name", () => {
    expect(getInitials("   ")).toBe("");
  });
});
