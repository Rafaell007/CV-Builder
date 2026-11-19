import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import { isCatalogConflict } from "../../../utils";
import {
  deleteDepartmentMock as deleteMock,
  deleteDepartmentRefusedMock as refusedMock,
} from "../departments.mocks";
import { useDeleteDepartment } from "./useDeleteDepartment";

// renderWithProviders renders elements; this small component lets the hook run inside the same providers.
function setup(options: RenderWithProvidersOptions) {
  let current!: ReturnType<typeof useDeleteDepartment>;
  function Probe(): ReactNode {
    current = useDeleteDepartment();
    return null;
  }
  renderWithProviders(<Probe />, options);
  return { result: () => current };
}

describe("useDeleteDepartment", () => {
  it("resolves when the department was deleted", async () => {
    const { result } = setup({ mocks: [deleteMock("7")] });

    await expect(result().remove("7")).resolves.toBeUndefined();
  });

  it("rejects with the CONFLICT error of a department in use", async () => {
    const { result } = setup({ mocks: [refusedMock("7")] });

    const error = await result()
      .remove("7")
      .catch((caught: unknown) => caught);

    expect(isCatalogConflict(error)).toBe(true);
  });
});
