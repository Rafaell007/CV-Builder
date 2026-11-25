import { describe, expect, it, vi } from "vitest";
import type { UseCatalogOptionsResult } from "@/shared/catalogOptions";
import { toProfileCatalog, toProfileFormValues } from "./profileForm.utils";

const react = { id: "d1", name: "React" };
const java = { id: "d3", name: "Java" };

const catalog = (overrides: Partial<UseCatalogOptionsResult> = {}): UseCatalogOptionsResult => ({
  options: [java, react],
  loading: false,
  failed: false,
  retry: vi.fn(),
  ...overrides,
});

describe("toProfileFormValues", () => {
  it("takes the names and the ids of the department and position", () => {
    expect(
      toProfileFormValues({
        firstName: "Emma",
        lastName: "Employee",
        department: { __typename: "Department", ...react },
        position: { __typename: "Position", id: "p1", name: "Software Engineer" },
      }),
    ).toEqual({ firstName: "Emma", lastName: "Employee", departmentId: "d1", positionId: "p1" });
  });

  it("uses empty values for what is not set", () => {
    expect(
      toProfileFormValues({ firstName: null, lastName: null, department: null, position: null }),
    ).toEqual({ firstName: "", lastName: "", departmentId: "", positionId: "" });
  });
});

describe("toProfileCatalog", () => {
  it("keeps the loaded list when it has the current item", () => {
    const loaded = catalog();

    expect(toProfileCatalog(loaded, react, false)).toBe(loaded);
  });

  it("keeps the loaded list when nothing is chosen", () => {
    const loaded = catalog();

    expect(toProfileCatalog(loaded, null, false)).toBe(loaded);
  });

  it("adds the current item when the load failed, and keeps the failure", () => {
    const failed = catalog({ options: undefined, failed: true });

    expect(toProfileCatalog(failed, react, false)).toEqual({ ...failed, options: [react] });
  });

  it("gives a read-only select only the current item, without a failure", () => {
    const failed = catalog({ options: undefined, failed: true });

    expect(toProfileCatalog(failed, react, true)).toMatchObject({
      options: [react],
      loading: false,
      failed: false,
    });
  });

  it("gives a read-only select no items when nothing is chosen", () => {
    expect(toProfileCatalog(catalog(), null, true).options).toEqual([]);
  });
});
