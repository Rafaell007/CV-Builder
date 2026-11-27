import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { readFailure } from "@/shared/failures";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import {
  deletePositionMock as deleteMock,
  deletePositionRefusedMock as refusedMock,
} from "../positions.mocks";
import { useDeletePosition } from "./useDeletePosition";

// renderWithProviders renders elements; this small component lets the hook run inside the same providers.
function setup(options: RenderWithProvidersOptions) {
  let current!: ReturnType<typeof useDeletePosition>;
  function Probe(): ReactNode {
    current = useDeletePosition();
    return null;
  }
  renderWithProviders(<Probe />, options);
  return { result: () => current };
}

describe("useDeletePosition", () => {
  it("resolves when the position was deleted", async () => {
    const { result } = setup({ mocks: [deleteMock("7")] });

    await expect(result().remove("7")).resolves.toBeUndefined();
  });

  it("rejects with the CONFLICT error of a position in use", async () => {
    const { result } = setup({ mocks: [refusedMock("7")] });

    const error = await result()
      .remove("7")
      .catch((caught: unknown) => caught);

    expect(readFailure(error).kind).toBe("conflict");
  });
});
