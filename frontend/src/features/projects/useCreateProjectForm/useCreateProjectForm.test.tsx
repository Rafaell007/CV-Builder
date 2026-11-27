import { act, screen } from "@testing-library/react";
import type { BaseSyntheticEvent, ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import {
  createProjectInvalidMock,
  createProjectMock,
  createProjectNetworkErrorMock,
} from "../projects.mocks";
import { useCreateProjectForm } from "./useCreateProjectForm";

const input = {
  name: "Blog",
  domain: "Blogging",
  startDate: "2026-01-10T00:00:00.000Z",
  endDate: "2026-06-30T00:00:00.000Z",
  description: "A blogging site",
  environmentIds: [],
};

// The submit handler only needs these two methods of the form event.
const fakeEvent = { preventDefault: () => undefined, persist: () => undefined };

// renderWithProviders renders elements; this small component lets the hook run inside the same providers.
function setup(options: RenderWithProvidersOptions) {
  let current!: ReturnType<typeof useCreateProjectForm>;
  function Probe(): ReactNode {
    current = useCreateProjectForm();
    return null;
  }
  renderWithProviders(<Probe />, options);
  return { result: () => current };
}

function fillForm(form: ReturnType<typeof useCreateProjectForm>["form"]) {
  form.setValue("name", input.name);
  form.setValue("domain", input.domain);
  form.setValue("startDate", new Date(2026, 0, 10));
  form.setValue("endDate", new Date(2026, 5, 30));
  form.setValue("description", input.description);
}

describe("useCreateProjectForm", () => {
  it("sends one request when submit is called twice in the same tick", async () => {
    // One create mock: a second request would find no mock and the modal would show the general error.
    const slowCreate = { ...createProjectMock(input), delay: 20 };
    const { result } = setup({ mocks: [slowCreate] });
    act(() => {
      result().open();
      fillForm(result().form);
    });

    await act(async () => {
      const event = fakeEvent as unknown as BaseSyntheticEvent;
      await Promise.all([result().submit(event), result().submit(event)]);
    });

    expect(result().failed).toBe(false);
    expect(result().isOpen).toBe(false);
    expect(await screen.findByText("Project created")).toBeInTheDocument();
  });

  describe("when the request fails", () => {
    type Result = () => ReturnType<typeof useCreateProjectForm>;

    function openAndFill(result: Result) {
      act(() => {
        result().open();
        fillForm(result().form);
      });
    }

    async function submit(result: Result) {
      await act(() => result().submit(fakeEvent as unknown as BaseSyntheticEvent));
    }

    const typed = { name: input.name, domain: input.domain, description: input.description };

    it("shows a BAD_USER_INPUT error under its field, keeps the values and the modal open", async () => {
      const { result } = setup({ mocks: [createProjectInvalidMock(input, ["name"])] });
      openAndFill(result);
      await submit(result);

      expect(result().form.getFieldState("name").error?.message).toBeTruthy();
      expect(result().failed).toBe(false);
      expect(result().isOpen).toBe(true);
      expect(result().form.getValues()).toMatchObject(typed);
      expect(screen.queryByText("Project created")).not.toBeInTheDocument();
    });

    it("keeps the values and the modal open after a network failure and sets failed", async () => {
      const { result } = setup({ mocks: [createProjectNetworkErrorMock(input)] });
      openAndFill(result);
      await submit(result);

      expect(result().failed).toBe(true);
      expect(result().isOpen).toBe(true);
      expect(result().form.getValues()).toMatchObject(typed);
      expect(screen.queryByText("Project created")).not.toBeInTheDocument();
    });

    it("accepts a second submit after a failure", async () => {
      const { result } = setup({
        mocks: [createProjectNetworkErrorMock(input), createProjectMock(input)],
      });
      openAndFill(result);
      await submit(result);
      expect(result().failed).toBe(true);

      await submit(result);

      expect(result().failed).toBe(false);
      expect(result().isOpen).toBe(false);
      expect(await screen.findByText("Project created")).toBeInTheDocument();
    });
  });
});
