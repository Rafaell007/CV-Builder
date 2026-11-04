import { describe, expect, it } from "vitest";
import { getSelectedOptions, toggleValue } from "./multiSelect.utils";

const OPTIONS = [
  { value: "react", label: "React" },
  { value: "nest", label: "NestJS" },
  { value: "pg", label: "PostgreSQL" },
];

describe("toggleValue", () => {
  it("adds a value that is not chosen yet, at the end", () => {
    expect(toggleValue(["pg"], "react")).toEqual(["pg", "react"]);
  });

  it("removes a value that is already chosen", () => {
    expect(toggleValue(["pg", "react"], "pg")).toEqual(["react"]);
  });
});

describe("getSelectedOptions", () => {
  it("returns the options in the order they were chosen", () => {
    expect(getSelectedOptions(OPTIONS, ["pg", "react"])).toEqual([OPTIONS[2], OPTIONS[0]]);
  });

  it("skips values that have no option", () => {
    expect(getSelectedOptions(OPTIONS, ["vue", "nest"])).toEqual([OPTIONS[1]]);
  });
});
