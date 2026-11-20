import { act } from "@testing-library/react";
import { useState, type ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import {
  sampleCategories,
  skillCategoriesMock,
  skillCategoriesNetworkErrorMock,
} from "../skills.mocks";
import { useSkillCategories, type UseSkillCategoriesResult } from "./useSkillCategories";

function setup(options: RenderWithProvidersOptions) {
  let current!: UseSkillCategoriesResult;
  let enable!: () => void;
  function Probe(): ReactNode {
    const [enabled, setEnabled] = useState(false);
    enable = () => setEnabled(true);
    current = useSkillCategories(enabled);
    return null;
  }
  renderWithProviders(<Probe />, options);
  return { result: () => current, enable: () => act(() => enable()) };
}

describe("useSkillCategories", () => {
  it("asks the backend only after it is enabled, and returns the categories with their type", async () => {
    const { result, enable } = setup({ mocks: [skillCategoriesMock()] });
    expect(result()).toMatchObject({ categories: undefined, loading: false });

    enable();

    await expect.poll(() => result().categories).toEqual(sampleCategories);
  });

  it("reports a failed request, and retry sends it again", async () => {
    const { result, enable } = setup({
      mocks: [skillCategoriesNetworkErrorMock(), skillCategoriesMock()],
    });
    enable();
    await expect.poll(() => result().failed).toBe(true);
    expect(result().categories).toBeUndefined();

    result().retry();

    await expect.poll(() => result().categories).toEqual(sampleCategories);
  });
});
