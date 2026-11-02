import { ValidationFailedException } from "../errors";
import { PageInput } from "./page.input";
import { resolveSort, toSkipTake } from "./pagination.utils";
import { SortDirection, SortInput } from "./sort.input";

function pageOf(number: number, size: number): PageInput {
  return Object.assign(new PageInput(), { number, size });
}

function sortOf(field: string, direction: SortDirection): SortInput {
  return Object.assign(new SortInput(), { field, direction });
}

describe("toSkipTake", () => {
  it.each([
    [1, 20, 0],
    [2, 20, 20],
    [3, 5, 10],
  ])("page %i of size %i skips %i rows", (number, size, skip) => {
    expect(toSkipTake(pageOf(number, size))).toEqual({ skip, take: size });
  });
});

describe("resolveSort", () => {
  const allowed = ["lastName", "createdAt"] as const;
  const fallback = { field: "createdAt", direction: "desc" } as const;

  it("returns the default when no sort is requested", () => {
    expect(resolveSort(undefined, allowed, fallback)).toBe(fallback);
  });

  it.each([
    [SortDirection.ASC, "asc"],
    [SortDirection.DESC, "desc"],
  ])("accepts an allowed field in direction %s", (direction, expected) => {
    expect(resolveSort(sortOf("lastName", direction), allowed, fallback)).toEqual({
      field: "lastName",
      direction: expected,
    });
  });

  it("rejects a field the module does not allow, naming the allowed ones", () => {
    const call = (): unknown =>
      resolveSort(sortOf("passwordHash", SortDirection.ASC), allowed, fallback);

    expect(call).toThrow(ValidationFailedException);
    try {
      call();
    } catch (error) {
      expect(error).toMatchObject({
        fieldErrors: [
          { field: "sort.field", messages: ["sort.field must be one of: lastName, createdAt"] },
        ],
      });
    }
  });
});
