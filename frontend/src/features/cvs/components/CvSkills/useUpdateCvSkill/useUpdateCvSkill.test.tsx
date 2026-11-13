import { act } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import { sampleSkills, updateCvSkillMock } from "../cvSkills.mocks";
import { useUpdateCvSkill, type UseUpdateCvSkillResult } from "./useUpdateCvSkill";

function setup(options: RenderWithProvidersOptions) {
  let current!: UseUpdateCvSkillResult;
  function Probe(): ReactNode {
    current = useUpdateCvSkill();
    return null;
  }
  renderWithProviders(<Probe />, options);
  return { result: () => current };
}

const typescript = sampleSkills[1]!;

describe("useUpdateCvSkill", () => {
  it("opens with the saved mastery and cannot save it (no meaningless request)", async () => {
    // No mock for `updateCvSkill`: a request would fail the test.
    const { result } = setup({ mocks: [] });

    act(() => result().open(typescript));
    await act(() => result().submit());

    expect(result()).toMatchObject({ isOpen: true, mastery: "ADVANCED", canSave: false });
    expect(result().error).toBeUndefined();
  });

  it("can save once the mastery differs, and cannot again when it is set back", () => {
    const { result } = setup({ mocks: [] });
    act(() => result().open(typescript));

    act(() => result().select("EXPERT"));
    expect(result().canSave).toBe(true);

    act(() => result().select("ADVANCED"));
    expect(result().canSave).toBe(false);
  });

  it("closes after the backend answered", async () => {
    const { result } = setup({ mocks: [updateCvSkillMock(typescript, "EXPERT")] });
    act(() => result().open(typescript));
    act(() => result().select("EXPERT"));

    await act(() => result().submit());

    expect(result().isOpen).toBe(false);
    expect(result().error).toBeUndefined();
  });

  it("keeps the skill after closing, so the modal does not change while it fades out", async () => {
    const { result } = setup({ mocks: [] });
    act(() => result().open(typescript));

    act(() => result().setOpen(false));

    expect(result().skill).toBe(typescript);
  });
});
