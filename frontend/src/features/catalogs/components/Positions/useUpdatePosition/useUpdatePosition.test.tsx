import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { readFailure } from "@/shared/failures";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import {
  updatePositionMock as updateMock,
  updatePositionRefusedMock as refusedMock,
} from "../positions.mocks";
import { useUpdatePosition } from "./useUpdatePosition";

// renderWithProviders renders elements; this small component lets the hook run inside the same providers.
function setup(options: RenderWithProvidersOptions) {
  let current!: ReturnType<typeof useUpdatePosition>;
  function Probe(): ReactNode {
    current = useUpdatePosition();
    return null;
  }
  renderWithProviders(<Probe />, options);
  return { result: () => current };
}

describe("useUpdatePosition", () => {
  it("resolves with the saved position", async () => {
    const { result } = setup({ mocks: [updateMock("7", "R&D")] });

    await expect(result().update("7", "R&D")).resolves.toMatchObject({ id: "7", name: "R&D" });
  });

  it("rejects with the CONFLICT error of a taken name", async () => {
    const { result } = setup({ mocks: [refusedMock("7", "Finance")] });

    const error = await result()
      .update("7", "Finance")
      .catch((caught: unknown) => caught);

    expect(readFailure(error).kind).toBe("conflict");
  });
});
