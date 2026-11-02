import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { ListArgs } from "./list.args";
import { PageInput } from "./page.input";
import { SortDirection, SortInput } from "./sort.input";

async function invalidFields(instance: object): Promise<string[]> {
  const errors = await validate(instance);
  return errors.map((error) => error.property);
}

describe("PageInput", () => {
  it("defaults to the first page of 20", () => {
    expect(new PageInput()).toEqual({ number: 1, size: 20 });
  });

  it.each([
    [{ number: 0, size: 20 }, "number"],
    [{ number: 1.5, size: 20 }, "number"],
    [{ number: 1, size: 0 }, "size"],
    [{ number: 1, size: 101 }, "size"],
  ])("rejects %j", async (plain, field) => {
    expect(await invalidFields(plainToInstance(PageInput, plain))).toEqual([field]);
  });

  it("accepts the largest page size", async () => {
    expect(await invalidFields(plainToInstance(PageInput, { number: 1, size: 100 }))).toEqual([]);
  });
});

describe("SortInput", () => {
  it("defaults to ascending", () => {
    expect(plainToInstance(SortInput, { field: "name" }).direction).toBe(SortDirection.ASC);
  });

  it.each([
    [{ field: "", direction: "ASC" }, "field"],
    [{ field: "name", direction: "SIDEWAYS" }, "direction"],
  ])("rejects %j", async (plain, field) => {
    expect(await invalidFields(plainToInstance(SortInput, plain))).toEqual([field]);
  });
});

describe("ListArgs", () => {
  it("is valid with no arguments and falls back to the default page", async () => {
    const args = plainToInstance(ListArgs, {});

    expect(await invalidFields(args)).toEqual([]);
    expect(args.page).toEqual({ number: 1, size: 20 });
  });

  it("trims the search term", () => {
    expect(plainToInstance(ListArgs, { search: "  ada  " }).search).toBe("ada");
  });

  it("rejects a search term over 100 characters", async () => {
    expect(await invalidFields(plainToInstance(ListArgs, { search: "a".repeat(101) }))).toEqual([
      "search",
    ]);
  });

  it("validates the nested page and sort", async () => {
    const args = plainToInstance(ListArgs, {
      sort: { field: "" },
      page: { number: 1, size: 500 },
    });

    expect((await invalidFields(args)).sort()).toEqual(["page", "sort"]);
  });
});
