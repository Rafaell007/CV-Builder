import { describe, expect, it } from "vitest";
import { MOCK_USERS, queryMockUsers } from "./DataTable.mocks";

describe("queryMockUsers", () => {
  it("returns the first page of 10 and the total", () => {
    const result = queryMockUsers({ page: 1 });

    expect(result.items).toHaveLength(10);
    expect(result.total).toBe(MOCK_USERS.length);
  });

  it("returns the rest on the last page", () => {
    expect(queryMockUsers({ page: 4 }).items).toHaveLength(MOCK_USERS.length - 30);
  });

  it("sorts before it pages", () => {
    const names = queryMockUsers({ page: 1, sort: { field: "lastName", direction: "DESC" } }).items;

    expect(names.map((user) => user.lastName)).toEqual(
      [...names.map((user) => user.lastName)].sort().reverse(),
    );
  });

  it("ignores a sort field that is not allowed", () => {
    expect(
      queryMockUsers({ page: 1, sort: { field: "email; DROP", direction: "ASC" } }).items,
    ).toEqual(queryMockUsers({ page: 1 }).items);
  });

  it("searches names and email, case-insensitive", () => {
    const result = queryMockUsers({ page: 1, search: "ADA" });

    expect(result.total).toBeGreaterThan(0);
    expect(result.total).toBeLessThan(MOCK_USERS.length);
  });

  it("returns no rows when nothing matches", () => {
    expect(queryMockUsers({ page: 1, search: "zzz" })).toEqual({ items: [], total: 0 });
  });
});
