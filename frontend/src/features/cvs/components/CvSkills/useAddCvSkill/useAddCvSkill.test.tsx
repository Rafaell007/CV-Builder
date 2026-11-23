import type { MockLink } from "@apollo/client/testing";
import { act } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import {
  addCvSkillMock,
  availableCvSkillsMock,
  availableSkill,
  CV_ID,
  cvSkillsMock,
} from "../cvSkills.mocks";
import { NO_MASTERY } from "../cvSkills.constants";
import { useAddCvSkill, type UseAddCvSkillResult } from "./useAddCvSkill";

function setup(options: RenderWithProvidersOptions) {
  let current!: UseAddCvSkillResult;
  function Probe(): ReactNode {
    current = useAddCvSkill(CV_ID);
    return null;
  }
  renderWithProviders(<Probe />, options);
  return { result: () => current };
}

const docker = availableSkill();

describe("useAddCvSkill", () => {
  it("starts closed, without a chosen skill", () => {
    const { result } = setup({ mocks: [] });

    expect(result()).toMatchObject({ isOpen: false, skillId: "", pending: false });
  });

  it("asks for the options only while the modal is open", async () => {
    const { result } = setup({ mocks: [availableCvSkillsMock([docker])] });
    expect(result().options).toBeUndefined();

    act(() => result().open());

    await expect.poll(() => result().options).toEqual([docker]);
  });

  it("says Skill is required and sends nothing when no skill is chosen (AC-17)", async () => {
    // No mock for `addCvSkill`: a request would fail the test with an unexpected-request error.
    const { result } = setup({ mocks: [availableCvSkillsMock([docker])] });
    act(() => result().open());

    await act(() => result().submit());

    expect(result().fieldError).toBe("Skill is required");
    expect(result().isOpen).toBe(true);
  });

  it("takes the error away when the user chooses a skill", async () => {
    const { result } = setup({ mocks: [availableCvSkillsMock([docker])] });
    act(() => result().open());
    await act(() => result().submit());

    act(() => result().select(docker.id));

    expect(result().fieldError).toBeUndefined();
    expect(result().skillId).toBe(docker.id);
  });

  it("starts empty each time the modal opens", async () => {
    const { result } = setup({
      mocks: [availableCvSkillsMock([docker]), availableCvSkillsMock([docker])],
    });
    act(() => result().open());
    act(() => result().select(docker.id));
    act(() => result().setOpen(false));

    act(() => result().open());

    expect(result().skillId).toBe("");
  });

  it("sends one request when submit is called twice in the same tick (AC: no duplicate submissions)", async () => {
    let requests = 0;
    const add = addCvSkillMock(docker);
    const counted: MockLink.MockedResponse = {
      request: add.request,
      result: () => {
        requests += 1;
        return { data: (add.result as { data: Record<string, unknown> }).data };
      },
    };
    const { result } = setup({
      mocks: [availableCvSkillsMock([docker]), counted, cvSkillsMock()],
    });
    act(() => result().open());
    act(() => result().select(docker.id));

    await act(async () => {
      await Promise.all([result().submit(), result().submit()]);
    });

    expect(requests).toBe(1);
    expect(result().isOpen).toBe(false);
  });

  it("sends no mastery when the user did not touch the field", async () => {
    const { result } = setup({
      mocks: [availableCvSkillsMock([docker]), addCvSkillMock(docker), cvSkillsMock()],
    });
    act(() => result().open());
    act(() => result().select(docker.id));

    // The mock has no mastery in its variables: a request with one would fail.
    await act(() => result().submit());
    expect(result().isOpen).toBe(false);
  });

  it("sends NONE after the user chose a level and then No mastery", async () => {
    const { result } = setup({
      mocks: [
        availableCvSkillsMock([docker]),
        addCvSkillMock(docker, CV_ID, "NONE"),
        cvSkillsMock(),
      ],
    });
    act(() => result().open());
    act(() => result().select(docker.id));
    act(() => result().selectMastery("EXPERT"));
    expect(result().mastery).toBe("EXPERT");

    act(() => result().selectMastery(NO_MASTERY));
    expect(result().mastery).toBe(NO_MASTERY);

    // The mock carries NONE in its variables: a request with another level would fail.
    await act(() => result().submit());
    expect(result().isOpen).toBe(false);
  });
});
