import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import { CV_ID, cvSkillsMock, cvSkillsNetworkErrorMock, sampleSkills } from "../cvSkills.mocks";
import { useCvSkills, type UseCvSkillsResult } from "./useCvSkills";

// renderWithProviders renders elements; this small component lets the hook run inside the same providers.
function setup(options: RenderWithProvidersOptions) {
  let current!: UseCvSkillsResult;
  function Probe(): ReactNode {
    current = useCvSkills(CV_ID);
    return null;
  }
  renderWithProviders(<Probe />, options);
  return { result: () => current };
}

describe("useCvSkills", () => {
  it("is loading, with no skills yet, until the backend answers", () => {
    const { result } = setup({ mocks: [cvSkillsMock()] });

    expect(result()).toMatchObject({ loading: true, skills: undefined, failed: false });
  });

  it("returns the skills of the backend in its order", async () => {
    const { result } = setup({ mocks: [cvSkillsMock()] });

    await expect.poll(() => result().skills).toEqual(sampleSkills);
    expect(result()).toMatchObject({ loading: false, failed: false });
  });

  it("reports a failed request, and retry sends it again", async () => {
    const { result } = setup({ mocks: [cvSkillsNetworkErrorMock(), cvSkillsMock()] });

    await expect.poll(() => result().failed).toBe(true);
    expect(result().skills).toBeUndefined();

    result().retry();

    await expect.poll(() => result().skills).toEqual(sampleSkills);
    expect(result().failed).toBe(false);
  });
});
