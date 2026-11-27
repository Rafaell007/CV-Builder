import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { readFailure } from "@/shared/failures";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import {
  createDepartmentMock as createMock,
  createDepartmentRefusedMock as refusedMock,
} from "../departments.mocks";
import { useCreateDepartment } from "./useCreateDepartment";

// renderWithProviders renders elements; this small component lets the hook run inside the same providers.
function setup(options: RenderWithProvidersOptions) {
  let current!: ReturnType<typeof useCreateDepartment>;
  function Probe(): ReactNode {
    current = useCreateDepartment();
    return null;
  }
  renderWithProviders(<Probe />, options);
  return { result: () => current };
}

describe("useCreateDepartment", () => {
  it("resolves with the saved department", async () => {
    const { result } = setup({ mocks: [createMock("Design")] });

    await expect(result().create("Design")).resolves.toMatchObject({ id: "new-1", name: "Design" });
  });

  it("rejects with the CONFLICT error of a taken name", async () => {
    const { result } = setup({ mocks: [refusedMock("Design")] });

    const error = await result()
      .create("Design")
      .catch((caught: unknown) => caught);

    expect(readFailure(error).kind).toBe("conflict");
  });
});
