import { describe, expect, it } from "vitest";
import type { DataTableColumn } from "../DataTable.types";
import { getHiddenColumnIds } from "./columns.utils";

const columns: DataTableColumn<string>[] = [
  { id: "a", header: "A", cell: (row) => row },
  { id: "b", header: "B", cell: (row) => row, hideBelow: 1024 },
  { id: "c", header: "C", cell: (row) => row, hideBelow: 600 },
];

describe("getHiddenColumnIds", () => {
  it("hides nothing at the widest limit", () => {
    expect(getHiddenColumnIds(columns, 1024)).toEqual([]);
  });

  it("hides a column one pixel below its limit", () => {
    expect(getHiddenColumnIds(columns, 1023)).toEqual(["b"]);
  });

  it("hides every column whose limit is above the width", () => {
    expect(getHiddenColumnIds(columns, 500)).toEqual(["b", "c"]);
  });

  it("never hides a column without a limit", () => {
    expect(getHiddenColumnIds(columns, 0)).not.toContain("a");
  });
});
