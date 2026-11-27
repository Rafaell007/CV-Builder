import { describe, expect, it } from "vitest";
import { getAriaSort, getNextSort } from "./sort.utils";

describe("getNextSort", () => {
  it("starts a field at ascending", () => {
    expect(getNextSort(undefined, "lastName")).toEqual({ field: "lastName", direction: "ASC" });
  });

  it("switches ascending to descending", () => {
    expect(getNextSort({ field: "lastName", direction: "ASC" }, "lastName")).toEqual({
      field: "lastName",
      direction: "DESC",
    });
  });

  it("switches descending back to ascending, never to no sort", () => {
    expect(getNextSort({ field: "lastName", direction: "DESC" }, "lastName")).toEqual({
      field: "lastName",
      direction: "ASC",
    });
  });

  it("starts at ascending when another field is sorted", () => {
    expect(getNextSort({ field: "lastName", direction: "DESC" }, "position")).toEqual({
      field: "position",
      direction: "ASC",
    });
  });
});

describe("getAriaSort", () => {
  it("returns the direction of the sorted field", () => {
    expect(getAriaSort({ field: "lastName", direction: "ASC" }, "lastName")).toBe("ascending");
    expect(getAriaSort({ field: "lastName", direction: "DESC" }, "lastName")).toBe("descending");
  });

  it("returns none for other fields and for no sort", () => {
    expect(getAriaSort({ field: "lastName", direction: "ASC" }, "position")).toBe("none");
    expect(getAriaSort(undefined, "position")).toBe("none");
  });
});
