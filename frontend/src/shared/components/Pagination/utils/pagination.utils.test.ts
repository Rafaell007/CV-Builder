import { describe, expect, it } from "vitest";
import { getPageCount, getPageItems } from "./pagination.utils";

describe("getPageCount", () => {
  it.each([
    [0, 10, 0],
    [1, 10, 1],
    [10, 10, 1],
    [11, 10, 2],
    [95, 10, 10],
  ])("returns the page count for total %i and page size %i", (total, size, expected) => {
    expect(getPageCount(total, size)).toBe(expected);
  });

  it("returns 0 for a negative total or a page size below 1", () => {
    expect(getPageCount(-5, 10)).toBe(0);
    expect(getPageCount(20, 0)).toBe(0);
  });
});

describe("getPageItems", () => {
  it("returns no items when there are no pages", () => {
    expect(getPageItems(1, 0)).toEqual([]);
  });

  it("lists every page when there are few", () => {
    expect(getPageItems(2, 4)).toEqual([1, 2, 3, 4]);
  });

  it("shows a gap after the first pages", () => {
    expect(getPageItems(1, 10)).toEqual([1, 2, "ellipsis", 10]);
  });

  it("shows gaps on both sides of a middle page", () => {
    expect(getPageItems(5, 10)).toEqual([1, "ellipsis", 4, 5, 6, "ellipsis", 10]);
  });

  it("shows a gap before the last pages", () => {
    expect(getPageItems(10, 10)).toEqual([1, "ellipsis", 9, 10]);
  });

  it("shows the page itself when only one page is hidden", () => {
    expect(getPageItems(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(getPageItems(4, 8)).toEqual([1, 2, 3, 4, 5, "ellipsis", 8]);
  });

  it("keeps a page number that is out of range inside the range", () => {
    expect(getPageItems(99, 3)).toEqual([1, 2, 3]);
    expect(getPageItems(0, 3)).toEqual([1, 2, 3]);
  });
});
