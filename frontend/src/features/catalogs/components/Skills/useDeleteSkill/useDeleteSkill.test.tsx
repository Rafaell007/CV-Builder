import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import { isCatalogConflict } from "../../../utils";
import {
  deleteSkillMock as deleteMock,
  deleteSkillRefusedMock as refusedMock,
} from "../skills.mocks";
import { useDeleteSkill } from "./useDeleteSkill";

// renderWithProviders renders elements; this small component lets the hook run inside the same providers.
function setup(options: RenderWithProvidersOptions) {
  let current!: ReturnType<typeof useDeleteSkill>;
  function Probe(): ReactNode {
    current = useDeleteSkill();
    return null;
  }
  renderWithProviders(<Probe />, options);
  return { result: () => current };
}

describe("useDeleteSkill", () => {
  it("resolves when the skill was deleted", async () => {
    const { result } = setup({ mocks: [deleteMock("7")] });

    await expect(result().remove("7")).resolves.toBeUndefined();
  });

  it("rejects with the CONFLICT error of a skill in use", async () => {
    const { result } = setup({ mocks: [refusedMock("7")] });

    const error = await result()
      .remove("7")
      .catch((caught: unknown) => caught);

    expect(isCatalogConflict(error)).toBe(true);
  });
});
