import { act } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderWithProviders, screen, type RenderWithProvidersOptions } from "@/shared/testing";
import {
  CV_ID,
  removeCvProjectsMock,
  removeCvProjectsNetworkErrorMock,
  removeCvProjectsRefusedMock,
  sampleCvProjects,
} from "../cvProjects.mocks";
import { useRemoveCvProject, type UseRemoveCvProjectResult } from "./useRemoveCvProject";

function setup(options: RenderWithProvidersOptions = { mocks: [] }) {
  let current!: UseRemoveCvProjectResult;
  function Probe(): ReactNode {
    current = useRemoveCvProject(CV_ID);
    return null;
  }
  renderWithProviders(<Probe />, options);
  return { result: () => current };
}

const [blogEntry] = sampleCvProjects;

describe("useRemoveCvProject", () => {
  it("has no project that waits for a confirmation at the start", () => {
    const { result } = setup();

    expect(result()).toMatchObject({ cvProject: null, pending: false });
  });

  it("holds the project from the moment the confirmation opens until CANCEL, and sends nothing (AC-21)", () => {
    // No mock: a request would fail the test with an unexpected-request error.
    const { result } = setup();

    act(() => result().askToRemove(blogEntry!));
    expect(result().cvProject).toBe(blogEntry);

    act(() => result().cancel());
    expect(result().cvProject).toBeNull();
  });

  it("removes the project with the id of its CV link, closes the confirmation and says so (AC-22)", async () => {
    const { result } = setup({ mocks: [removeCvProjectsMock(["link-1"])] });
    act(() => result().askToRemove(blogEntry!));

    let removed = false;
    await act(async () => {
      removed = await result().confirm();
    });

    expect(removed).toBe(true);
    expect(result().cvProject).toBeNull();
    expect(await screen.findByText("Project removed")).toBeInTheDocument();
  });

  it("sends one request when confirm is called twice in the same tick (AC-26)", async () => {
    // One mock: a second request would find no mock, and the answer would be a failure toast.
    const slow = { ...removeCvProjectsMock(["link-1"]), delay: 20 };
    const { result } = setup({ mocks: [slow] });
    act(() => result().askToRemove(blogEntry!));

    await act(async () => {
      await Promise.all([result().confirm(), result().confirm()]);
    });

    expect(screen.queryByText("Could not remove the project")).not.toBeInTheDocument();
    expect(await screen.findByText("Project removed")).toBeInTheDocument();
  });

  it.each([
    ["NOT_FOUND", "This project is not in the CV any more. The list was updated."],
    ["FORBIDDEN", "You are not allowed to change this CV."],
    ["INTERNAL_SERVER_ERROR", "Something went wrong. Please try again."],
  ])("shows a toast for %s and removes nothing (AC-42)", async (code, text) => {
    const { result } = setup({ mocks: [removeCvProjectsRefusedMock(["link-1"], code)] });
    act(() => result().askToRemove(blogEntry!));

    let removed = true;
    await act(async () => {
      removed = await result().confirm();
    });

    expect(removed).toBe(false);
    expect(result().cvProject).toBeNull();
    expect(await screen.findByText("Could not remove the project")).toBeInTheDocument();
    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it("shows the general toast when the request does not reach the backend", async () => {
    const { result } = setup({ mocks: [removeCvProjectsNetworkErrorMock(["link-1"])] });
    act(() => result().askToRemove(blogEntry!));

    await act(async () => {
      await result().confirm();
    });

    expect(await screen.findByText("Something went wrong. Please try again.")).toBeInTheDocument();
  });
});
