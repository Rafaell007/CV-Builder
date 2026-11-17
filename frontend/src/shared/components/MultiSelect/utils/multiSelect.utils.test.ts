import { describe, expect, it } from "vitest";
import { findScrollParent, getSelectedOptions, toggleValue } from "./multiSelect.utils";

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

describe("findScrollParent", () => {
  it("returns the nearest ancestor that scrolls vertically", () => {
    document.body.innerHTML = `<div id="outer" style="overflow-y: auto"><div id="inner" style="overflow-y: scroll"><p id="item"></p></div></div>`;
    const item = document.getElementById("item")!;

    expect(findScrollParent(item)?.id).toBe("inner");
  });

  it("returns null when no ancestor scrolls", () => {
    document.body.innerHTML = `<div><p id="item"></p></div>`;

    expect(findScrollParent(document.getElementById("item")!)).toBeNull();
  });
});
