import { act } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import { CV_ID, cvSkillsMock, removeCvSkillsMock } from "../cvSkills.mocks";
import { useRemoveCvSkills, type UseRemoveCvSkillsResult } from "./useRemoveCvSkills";

function setup(options: RenderWithProvidersOptions = { mocks: [] }) {
  let current!: UseRemoveCvSkillsResult;
  function Probe(): ReactNode {
    current = useRemoveCvSkills(CV_ID);
    return null;
  }
  renderWithProviders(<Probe />, options);
  return { result: () => current };
}

describe("useRemoveCvSkills", () => {
  it("is not in selection mode at the start", () => {
    const { result } = setup();

    expect(result()).toMatchObject({ selecting: false, count: 0, confirming: false });
  });

  it("chooses and un-chooses skills by id and counts them (AC-28, AC-30)", () => {
    const { result } = setup();
    act(() => result().start());

    act(() => result().toggle("link-1"));
    act(() => result().toggle("link-2"));
    expect(result()).toMatchObject({ selectedIds: ["link-1", "link-2"], count: 2 });

    act(() => result().toggle("link-1"));
    expect(result()).toMatchObject({ selectedIds: ["link-2"], count: 1 });
  });

  it("does not ask for a confirmation when nothing is chosen (AC-31)", () => {
    const { result } = setup();
    act(() => result().start());

    act(() => result().askToRemove());

    expect(result().confirming).toBe(false);
  });

  it("clears the choice when the mode is left and when it starts again", () => {
    const { result } = setup();
    act(() => result().start());
    act(() => result().toggle("link-1"));

    act(() => result().cancel());
    expect(result()).toMatchObject({ selecting: false, count: 0 });

    act(() => result().start());
    expect(result().count).toBe(0);
  });

  it("leaves the mode on Escape", () => {
    const { result } = setup();
    act(() => result().start());
    act(() => result().toggle("link-1"));

    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });

    expect(result()).toMatchObject({ selecting: false, count: 0 });
  });

  it("leaves Escape to the confirmation while it is open", () => {
    const { result } = setup();
    act(() => result().start());
    act(() => result().toggle("link-1"));
    act(() => result().askToRemove());

    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });

    expect(result()).toMatchObject({ selecting: true, confirming: true, count: 1 });
  });

  it("keeps the choice when the confirmation is cancelled", () => {
    const { result } = setup();
    act(() => result().start());
    act(() => result().toggle("link-1"));
    act(() => result().askToRemove());

    act(() => result().cancelConfirm());

    expect(result()).toMatchObject({ selecting: true, confirming: false, count: 1 });
  });

  it("sends nothing when confirm is called without a choice", async () => {
    // No mock for `removeCvSkills`: a request would fail the test.
    const { result } = setup();

    await expect(act(() => result().confirm())).resolves.toBe(false);
    expect(result().pending).toBe(false);
  });

  it("removes the chosen skills, then leaves the mode", async () => {
    const { result } = setup({
      mocks: [cvSkillsMock(), removeCvSkillsMock(["link-1"]), cvSkillsMock([])],
    });
    act(() => result().start());
    act(() => result().toggle("link-1"));
    act(() => result().askToRemove());

    await act(async () => {
      await result().confirm();
    });

    expect(result()).toMatchObject({ selecting: false, confirming: false, count: 0 });
  });
});
