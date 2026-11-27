import { describe, expect, it, vi } from "vitest";
import type { UseCatalogOptionsResult } from "@/shared/catalogOptions";
import { CONCURRENT_CHANGE_REASON } from "@/shared/userProfile";
import {
  hasProfileChanged,
  toProfileCatalog,
  toProfileFormValues,
  toProfileGeneralError,
  toUpdateProfileInput,
} from "./profileForm.utils";

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

const saved = { firstName: "Emma", lastName: "Employee", departmentId: "d1", positionId: "p1" };

describe("toUpdateProfileInput", () => {
  it("sends the checked values with the id of the user", () => {
    expect(toUpdateProfileInput("7", saved)).toEqual({ id: "7", ...saved });
  });
});

describe("hasProfileChanged", () => {
  it("is false for the saved values", () => {
    expect(hasProfileChanged({ ...saved }, saved)).toBe(false);
  });

  it("is false when a name only got spaces around it", () => {
    expect(
      hasProfileChanged({ ...saved, firstName: " Emma ", lastName: "Employee  " }, saved),
    ).toBe(false);
  });

  it.each([
    ["firstName", "Emily"],
    ["lastName", "Engineer"],
    ["departmentId", "d3"],
    ["positionId", "p2"],
  ])("is true when %s changed", (field, value) => {
    expect(hasProfileChanged({ ...saved, [field]: value }, saved)).toBe(true);
  });
});

describe("toProfileGeneralError", () => {
  it.each([
    [{ kind: "forbidden" as const }, "forbidden"],
    [{ kind: "notFound" as const }, "notFound"],
    [{ kind: "conflict" as const, reason: CONCURRENT_CHANGE_REASON }, "concurrentChange"],
    [{ kind: "conflict" as const, reason: "OTHER" }, "failed"],
    [{ kind: "invalid" as const }, "failed"],
    [{ kind: "unknown" as const }, "failed"],
  ])("maps %o to %s", (failure, expected) => {
    expect(toProfileGeneralError(failure)).toBe(expected);
  });
});
