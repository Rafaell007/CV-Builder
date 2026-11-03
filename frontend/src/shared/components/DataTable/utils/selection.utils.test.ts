import { describe, expect, it } from "vitest";
import { getSelectAllState, toggleAll, toggleId } from "./selection.utils";

describe("toggleId", () => {
  it("adds an id that is not selected", () => {
    expect(toggleId(["a"], "b")).toEqual(["a", "b"]);
  });

  it("removes an id that is selected", () => {
    expect(toggleId(["a", "b"], "a")).toEqual(["b"]);
  });
});

describe("getSelectAllState", () => {
  it("is false when no row of the page is selected", () => {
    expect(getSelectAllState(["a", "b"], ["x"])).toBe(false);
    expect(getSelectAllState([], [])).toBe(false);
  });

  it("is indeterminate when some rows of the page are selected", () => {
    expect(getSelectAllState(["a", "b"], ["a"])).toBe("indeterminate");
  });

  it("is true when every row of the page is selected", () => {
    expect(getSelectAllState(["a", "b"], ["b", "a", "x"])).toBe(true);
  });
});

describe("toggleAll", () => {
  it("selects the rows of the page and keeps the other selection", () => {
    expect(toggleAll(["a", "b"], ["x", "a"])).toEqual(["x", "a", "b"]);
  });

  it("deselects the rows of the page when all are selected", () => {
    expect(toggleAll(["a", "b"], ["x", "a", "b"])).toEqual(["x"]);
  });
});
