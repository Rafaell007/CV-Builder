import { act } from "@testing-library/react";
import type { BaseSyntheticEvent, ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderWithProviders, screen, type RenderWithProvidersOptions } from "@/shared/testing";
import {
  addCvProjectMock,
  addCvProjectNetworkErrorMock,
  addCvProjectRefusedMock,
  bank,
  cvProject,
  CV_ID,
  cvProjectsMock,
  projectCatalogMock,
  projectRolesMock,
  sampleRoles,
} from "../cvProjects.mocks";
import { useAddCvProject, type UseAddCvProjectResult } from "./useAddCvProject";

// The submit handler only needs these two methods of the form event.
const fakeEvent = { preventDefault: () => undefined, persist: () => undefined };
const blogEntry = cvProject();
const submitEvent = fakeEvent as unknown as BaseSyntheticEvent;

function setup(options: RenderWithProvidersOptions) {
  let current!: UseAddCvProjectResult;
  function Probe(): ReactNode {
    current = useAddCvProject(CV_ID);
    return null;
  }
  renderWithProviders(<Probe />, options);
  return { result: () => current };
}

// The projects that the CV holds, asked without a search (blog is in the CV, bank is not).
const heldMock = () => cvProjectsMock([blogEntry], { cvId: CV_ID });
const openMocks = () => [projectCatalogMock(), projectRolesMock(), heldMock()];

// What the form sends for the bank project with the dates of the project and one role.
const bankInput = {
  cvId: CV_ID,
  projectId: bank.id,
  startDate: "2024-03-01T00:00:00.000Z",
  endDate: "2025-06-30T00:00:00.000Z",
  responsibilities: null,
  roleIds: ["role-1"],
};

async function openAndChooseBank(result: () => UseAddCvProjectResult) {
  act(() => result().open());
  await expect.poll(() => result().options).toBeDefined();
  act(() => result().selectProject(bank.id));
  act(() => result().form.setValue("roleIds", ["role-1"], { shouldValidate: true }));
}

describe("useAddCvProject", () => {
  it("starts closed and asks the backend for nothing", () => {
    // No mocks: a request would fail the test with an unexpected-request error.
    const { result } = setup({ mocks: [] });

    expect(result()).toMatchObject({ isOpen: false, options: undefined, roles: undefined });
  });

  it("loads the options when the modal opens, without the projects the CV holds (AC-8, AC-31)", async () => {
    const { result } = setup({ mocks: openMocks() });

    act(() => result().open());

    await expect.poll(() => result().options?.map((item) => item.name)).toEqual(["Online Bank"]);
    await expect.poll(() => result().roles).toEqual(sampleRoles);
  });

  it("fills the dates with the days of the chosen project and shows the project (AC-8)", async () => {
    const { result } = setup({ mocks: openMocks() });
    act(() => result().open());
    await expect.poll(() => result().options).toBeDefined();

    act(() => result().selectProject(bank.id));

    expect(result().project).toEqual(bank);
    expect(result().form.getValues()).toMatchObject({
      projectId: bank.id,
      startDate: new Date(2024, 2, 1),
      endDate: new Date(2025, 5, 30),
    });
  });

  it("starts empty each time the modal opens", async () => {
    const { result } = setup({ mocks: [...openMocks(), ...openMocks()] });
    await openAndChooseBank(result);

    act(() => result().setOpen(false));
    act(() => result().open());

    expect(result().form.getValues()).toMatchObject({
      projectId: "",
      startDate: null,
      roleIds: [],
    });
  });

  it("is valid only with a project, a start date and a role (AC-14, AC-16)", async () => {
    const { result } = setup({ mocks: openMocks() });
    act(() => result().open());
    await expect.poll(() => result().options).toBeDefined();

    // No `addCvProject` mock: a request would fail the test with an unexpected-request error.
    await act(() => result().submit(submitEvent));

    const message = (field: "projectId" | "startDate" | "roleIds") =>
      result().form.getFieldState(field).error?.message;
    expect(message("projectId")).toBe("Project is required");
    expect(message("startDate")).toBe("Start date is required");
    expect(message("roleIds")).toBe("At least one role must be selected");
    expect(result().isOpen).toBe(true);
  });

  it("adds the project, closes the modal and says so (AC-7, AC-41)", async () => {
    const added = cvProject({ id: "link-new", project: bank, roles: [sampleRoles[0]!] });
    // The second held mock answers the list that loads again after the request.
    const { result } = setup({
      mocks: [...openMocks(), addCvProjectMock(bankInput, added), heldMock()],
    });
    await openAndChooseBank(result);

    await act(() => result().submit(submitEvent));

    expect(result().isOpen).toBe(false);
    expect(result().error).toBeUndefined();
    expect(await screen.findByText("Project added")).toBeInTheDocument();
  });

  it("sends the end date and the responsibilities that the user entered", async () => {
    const input = {
      ...bankInput,
      endDate: "2025-01-31T00:00:00.000Z",
      responsibilities: "Built the pages.",
    };
    const { result } = setup({
      mocks: [
        ...openMocks(),
        addCvProjectMock(input, cvProject({ id: "link-new", project: bank })),
        heldMock(),
      ],
    });
    await openAndChooseBank(result);
    act(() => {
      result().form.setValue("endDate", new Date(2025, 0, 31), { shouldValidate: true });
      result().form.setValue("responsibilities", "  Built the pages.  ");
    });

    await act(() => result().submit(submitEvent));

    expect(result().isOpen).toBe(false);
  });

  it("keeps the values and shows the conflict message, then loads the options again (AC-27, AC-31)", async () => {
    // The conflict loads the catalog and the held projects again: one more answer for each.
    const { result } = setup({
      mocks: [
        ...openMocks(),
        addCvProjectRefusedMock(bankInput, "CONFLICT"),
        projectCatalogMock(),
        heldMock(),
      ],
    });
    await openAndChooseBank(result);

    await act(() => result().submit(submitEvent));

    expect(result().isOpen).toBe(true);
    expect(result().error).toBe(
      "This project is already in the CV, or its dates changed. Please try again.",
    );
    expect(result().form.getValues()).toMatchObject({ projectId: bank.id, roleIds: ["role-1"] });
  });

  it("shows a field error of the backend under its field and keeps the values (AC-24, AC-34)", async () => {
    const { result } = setup({
      mocks: [...openMocks(), addCvProjectRefusedMock(bankInput, "BAD_USER_INPUT", ["startDate"])],
    });
    await openAndChooseBank(result);

    await act(() => result().submit(submitEvent));

    expect(result().form.getFieldState("startDate").error?.message).toBe(
      "Start date must be within project duration",
    );
    // The field error is enough: no second, general message.
    expect(result().error).toBeUndefined();
    expect(result().form.getValues("projectId")).toBe(bank.id);
  });

  it("shows the general message when the request does not reach the backend (AC-42)", async () => {
    const { result } = setup({ mocks: [...openMocks(), addCvProjectNetworkErrorMock(bankInput)] });
    await openAndChooseBank(result);

    await act(() => result().submit(submitEvent));

    expect(result().isOpen).toBe(true);
    expect(result().error).toBe("Something went wrong. Please try again later");
  });

  it("sends one request when submit is called twice in the same tick (AC-26)", async () => {
    const added = cvProject({ id: "link-new", project: bank });
    // One add mock: a second request would find no mock and the modal would show the general message.
    const slow = { ...addCvProjectMock(bankInput, added), delay: 20 };
    const { result } = setup({ mocks: [...openMocks(), slow, heldMock()] });
    await openAndChooseBank(result);

    await act(async () => {
      await Promise.all([result().submit(submitEvent), result().submit(submitEvent)]);
    });

    expect(result().error).toBeUndefined();
    expect(result().isOpen).toBe(false);
  });
});
