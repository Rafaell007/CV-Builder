import { act, screen } from "@testing-library/react";
import type { BaseSyntheticEvent, ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import { blog, updateProjectMock } from "../projects.mocks";
import { useUpdateProjectForm } from "./useUpdateProjectForm";

// The submit handler only needs these two methods of the form event.
const fakeEvent = { preventDefault: () => undefined, persist: () => undefined };

// renderWithProviders renders elements; this small component lets the hook run inside the same providers.
function setup(options: RenderWithProvidersOptions) {
  let current!: ReturnType<typeof useUpdateProjectForm>;
  function Probe(): ReactNode {
    current = useUpdateProjectForm();
    return null;
  }
  renderWithProviders(<Probe />, options);
  return { result: () => current };
}

const input = {
  id: "1",
  name: "Blog 2",
  domain: "Blogging",
  startDate: "2025-12-31T00:00:00.000Z",
  endDate: "2026-05-31T00:00:00.000Z",
  description: blog.description,
  environmentIds: ["10", "11", "12", "13", "14", "15"],
};

describe("useUpdateProjectForm", () => {
  it("fills the form with the project when it opens", () => {
    const { result } = setup({ mocks: [] });

    act(() => result().open(blog));

    expect(result().isOpen).toBe(true);
    expect(result().form.getValues()).toMatchObject({ name: "Blog", domain: "Blogging" });
  });

  it("sends one request when submit is called twice in the same tick", async () => {
    // One update mock: a second request would find no mock and the modal would show the general error.
    const slowUpdate = { ...updateProjectMock(input, blog.environment), delay: 20 };
    const { result } = setup({ mocks: [slowUpdate] });
    act(() => {
      result().open(blog);
      result().form.setValue("name", "Blog 2", { shouldDirty: true });
    });

    await act(async () => {
      const event = fakeEvent as unknown as BaseSyntheticEvent;
      await Promise.all([result().submit(event), result().submit(event)]);
    });

    expect(result().failed).toBe(false);
    expect(result().isOpen).toBe(false);
    expect(await screen.findByText("Project updated")).toBeInTheDocument();
  });
});
