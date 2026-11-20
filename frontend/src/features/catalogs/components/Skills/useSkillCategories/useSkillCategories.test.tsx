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
  let disable!: () => void;
  function Probe(): ReactNode {
    const [enabled, setEnabled] = useState(false);
    enable = () => setEnabled(true);
    disable = () => setEnabled(false);
    current = useSkillCategories(enabled);
    return null;
  }
  renderWithProviders(<Probe />, options);
  return {
    result: () => current,
    enable: () => act(() => enable()),
    disable: () => act(() => disable()),
  };
}

describe("useSkillCategories", () => {
  it("asks the backend only after it is enabled, and returns the categories with their type", async () => {
    const { result, enable } = setup({ mocks: [skillCategoriesMock()] });
    expect(result()).toMatchObject({ categories: undefined, loading: false });

    enable();

    await expect.poll(() => result().categories).toEqual(sampleCategories);
  });

  it("keeps the categories after it is disabled again (the modal fades out)", async () => {
    const { result, enable, disable } = setup({ mocks: [skillCategoriesMock()] });
    enable();
    await expect.poll(() => result().categories).toEqual(sampleCategories);

    disable();
    expect(result().categories).toEqual(sampleCategories);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(result().categories).toEqual(sampleCategories);

    enable();
    expect(result().categories).toEqual(sampleCategories);
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
