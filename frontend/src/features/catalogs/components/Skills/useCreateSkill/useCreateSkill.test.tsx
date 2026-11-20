import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { getServerFieldErrors } from "@/shared/forms";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import { isCatalogConflict } from "../../../utils";
import {
  createSkillMock as createMock,
  createSkillRefusedMock as refusedMock,
  toolsCategory,
} from "../skills.mocks";
import { useCreateSkill } from "./useCreateSkill";

// renderWithProviders renders elements; this small component lets the hook run inside the same providers.
function setup(options: RenderWithProvidersOptions) {
  let current!: ReturnType<typeof useCreateSkill>;
  function Probe(): ReactNode {
    current = useCreateSkill();
    return null;
  }
  renderWithProviders(<Probe />, options);
  return { result: () => current };
}

const input = { name: "Docker", categoryId: toolsCategory.id };

describe("useCreateSkill", () => {
  it("sends the name and the category, and resolves with the saved skill and its category", async () => {
    const { result } = setup({ mocks: [createMock(input)] });

    await expect(result().create(input)).resolves.toMatchObject({
      id: "new-1",
      name: "Docker",
      category: { id: toolsCategory.id, type: "Tool" },
    });
  });

  it("rejects with the CONFLICT error of a taken name", async () => {
    const { result } = setup({ mocks: [refusedMock(input)] });

    const error = await result()
      .create(input)
      .catch((caught: unknown) => caught);

    expect(isCatalogConflict(error)).toBe(true);
  });

  it("rejects with the categoryId field error of a missing category", async () => {
    const { result } = setup({
      mocks: [
        refusedMock(input, {
          code: "BAD_USER_INPUT",
          message: "Category not found",
          field: "categoryId",
        }),
      ],
    });

    const error = await result()
      .create(input)
      .catch((caught: unknown) => caught);

    expect(getServerFieldErrors(error)).toEqual([
      { field: "categoryId", messages: ["Category not found"] },
    ]);
  });
});
