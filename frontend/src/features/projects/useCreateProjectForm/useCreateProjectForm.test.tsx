import { act, screen } from "@testing-library/react";
import type { BaseSyntheticEvent, ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import { createProjectMock } from "../projects.mocks";
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
});
