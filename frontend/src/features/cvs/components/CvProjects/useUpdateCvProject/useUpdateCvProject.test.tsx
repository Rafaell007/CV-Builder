import { act } from "@testing-library/react";
import type { BaseSyntheticEvent, ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderWithProviders, screen, type RenderWithProvidersOptions } from "@/shared/testing";
import {
  cvProject,
  projectRolesMock,
  sampleCvProjects,
  sampleRoles,
  updateCvProjectMock,
  updateCvProjectNetworkErrorMock,
  updateCvProjectRefusedMock,
} from "../cvProjects.mocks";
import { useUpdateCvProject, type UseUpdateCvProjectResult } from "./useUpdateCvProject";

// The submit handler only needs these two methods of the form event.
const submitEvent = {
  preventDefault: () => undefined,
  persist: () => undefined,
} as unknown as BaseSyntheticEvent;

function setup(options: RenderWithProvidersOptions) {
  let current!: UseUpdateCvProjectResult;
  function Probe(): ReactNode {
    current = useUpdateCvProject();
    return null;
  }
  renderWithProviders(<Probe />, options);
  return { result: () => current };
}

const [blogEntry] = sampleCvProjects;

// What the form sends when the user changes the roles of the blog entry.
const rolesInput = {
  id: "link-1",
  startDate: "2025-02-01T00:00:00.000Z",
  endDate: "2025-11-30T00:00:00.000Z",
  responsibilities: "Built the pages.",
  roleIds: ["role-1", "role-2"],
};

function openAndChangeRoles(result: () => UseUpdateCvProjectResult) {
  act(() => result().open(blogEntry!));
  act(() =>
    result().form.setValue("roleIds", ["role-1", "role-2"], {
      shouldDirty: true,
      shouldValidate: true,
    }),
  );
}

describe("useUpdateCvProject", () => {
  it("starts closed, with no project and no roles loaded", () => {
    const { result } = setup({ mocks: [] });

    expect(result()).toMatchObject({ isOpen: false, project: undefined, roles: undefined });
  });

  it("fills the form with the current data and loads the roles when it opens (AC-10, AC-18)", async () => {
    const { result } = setup({ mocks: [projectRolesMock()] });

    act(() => result().open(blogEntry!));

    expect(result().isOpen).toBe(true);
    expect(result().project).toEqual(blogEntry!.project);
    expect(result().form.getValues()).toEqual({
      projectId: "project-1",
      startDate: new Date(2025, 1, 1),
      endDate: new Date(2025, 10, 30),
      roleIds: ["role-1"],
      responsibilities: "Built the pages.",
    });
    await expect.poll(() => result().roles).toEqual(sampleRoles);
  });

  it("is not dirty until a value changes, so SAVE stays disabled (AC-20)", () => {
    const { result } = setup({ mocks: [projectRolesMock()] });

    act(() => result().open(blogEntry!));

    expect(result().form.formState.isDirty).toBe(false);
    act(() => result().form.setValue("responsibilities", "More", { shouldDirty: true }));
    expect(result().form.formState.isDirty).toBe(true);
  });

  it("saves the change, closes the modal and says so (AC-10, AC-41)", async () => {
    const updated = cvProject({ ...blogEntry!, roles: sampleRoles.slice(0, 2) });
    const { result } = setup({
      mocks: [projectRolesMock(), updateCvProjectMock(rolesInput, updated)],
    });
    openAndChangeRoles(result);

    await act(() => result().submit(submitEvent));

    expect(result().isOpen).toBe(false);
    expect(await screen.findByText("Project updated")).toBeInTheDocument();
  });

  it("does not send a project, only the editable values (AC-19, AC-37)", async () => {
    // The mock answers only this exact input: it has no `projectId`.
    const { result } = setup({
      mocks: [projectRolesMock(), updateCvProjectMock(rolesInput, cvProject({ ...blogEntry! }))],
    });
    openAndChangeRoles(result);

    await act(() => result().submit(submitEvent));

    expect(result().error).toBeUndefined();
  });

  it("refuses a start date outside the project days without a request (AC-15)", async () => {
    const { result } = setup({ mocks: [projectRolesMock()] });
    act(() => result().open(blogEntry!));
    act(() =>
      result().form.setValue("startDate", new Date(2024, 0, 1), {
        shouldDirty: true,
        shouldValidate: true,
      }),
    );

    await act(() => result().submit(submitEvent));

    expect(result().form.getFieldState("startDate").error?.message).toBe(
      "Start date must be within project duration",
    );
    expect(result().isOpen).toBe(true);
  });

  it("keeps the values and shows the error inside the modal when the request fails (AC-27)", async () => {
    const { result } = setup({
      mocks: [projectRolesMock(), updateCvProjectRefusedMock(rolesInput, "FORBIDDEN")],
    });
    openAndChangeRoles(result);

    await act(() => result().submit(submitEvent));

    expect(result().isOpen).toBe(true);
    expect(result().error).toBe("You are not allowed to change this CV.");
    expect(result().form.getValues("roleIds")).toEqual(["role-1", "role-2"]);
  });

  it("shows a field error of the backend under its field (AC-24)", async () => {
    const { result } = setup({
      mocks: [
        projectRolesMock(),
        updateCvProjectRefusedMock(rolesInput, "BAD_USER_INPUT", ["roleIds"]),
      ],
    });
    openAndChangeRoles(result);

    await act(() => result().submit(submitEvent));

    expect(result().form.getFieldState("roleIds").error?.message).toBe(
      "At least one valid role must be selected",
    );
    expect(result().error).toBeUndefined();
  });

  it("shows the general message when the request does not reach the backend (AC-42)", async () => {
    const { result } = setup({
      mocks: [projectRolesMock(), updateCvProjectNetworkErrorMock(rolesInput)],
    });
    openAndChangeRoles(result);

    await act(() => result().submit(submitEvent));

    expect(result().isOpen).toBe(true);
    expect(result().error).toBe("Something went wrong. Please try again later");
  });
});
