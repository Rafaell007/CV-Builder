import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import { isCatalogConflict } from "../../../utils";
import {
  databasesCategory,
  updateSkillMock as updateMock,
  updateSkillRefusedMock as refusedMock,
} from "../skills.mocks";
import { useUpdateSkill } from "./useUpdateSkill";

// renderWithProviders renders elements; this small component lets the hook run inside the same providers.
function setup(options: RenderWithProvidersOptions) {
  let current!: ReturnType<typeof useUpdateSkill>;
  function Probe(): ReactNode {
    current = useUpdateSkill();
    return null;
  }
  renderWithProviders(<Probe />, options);
  return { result: () => current };
}

const input = { name: "React.js", categoryId: databasesCategory.id };

describe("useUpdateSkill", () => {
  it("sends the id, the name and the category, and resolves with the saved skill", async () => {
    const { result } = setup({ mocks: [updateMock("1", input)] });

    await expect(result().update("1", input)).resolves.toMatchObject({
      id: "1",
      name: "React.js",
      category: { id: databasesCategory.id },
    });
  });

  it("rejects with the CONFLICT error of a name another skill has", async () => {
    const { result } = setup({ mocks: [refusedMock("1", input)] });

    const error = await result()
      .update("1", input)
      .catch((caught: unknown) => caught);

    expect(isCatalogConflict(error)).toBe(true);
  });
});
