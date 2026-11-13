import { act } from "@testing-library/react";
import { useState, type ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import {
  availableCvSkillsMock,
  availableCvSkillsNetworkErrorMock,
  availableSkill,
  CV_ID,
} from "../cvSkills.mocks";
import { useAvailableCvSkills, type UseAvailableCvSkillsResult } from "./useAvailableCvSkills";

function setup(options: RenderWithProvidersOptions) {
  let current!: UseAvailableCvSkillsResult;
  let setEnabled!: (enabled: boolean) => void;
  function Probe(): ReactNode {
    const [enabled, set] = useState(false);
    setEnabled = set;
    current = useAvailableCvSkills(CV_ID, enabled);
    return null;
  }
  renderWithProviders(<Probe />, options);
  return { result: () => current, enable: () => act(() => setEnabled(true)) };
}

describe("useAvailableCvSkills", () => {
  it("sends nothing while it is not enabled", () => {
    const { result } = setup({ mocks: [availableCvSkillsMock()] });

    expect(result()).toMatchObject({ options: undefined, loading: false, failed: false });
  });

  it("returns the options of the backend once it is enabled", async () => {
    const docker = availableSkill();
    const { result, enable } = setup({ mocks: [availableCvSkillsMock([docker])] });

    enable();

    await expect.poll(() => result().options).toEqual([docker]);
  });

  it("reports a failed request, and retry sends it again", async () => {
    const docker = availableSkill();
    const { result, enable } = setup({
      mocks: [availableCvSkillsNetworkErrorMock(), availableCvSkillsMock([docker])],
    });

    enable();
    await expect.poll(() => result().failed).toBe(true);

    result().retry();

    await expect.poll(() => result().options).toEqual([docker]);
  });
});
