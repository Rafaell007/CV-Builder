import { act, screen } from "@testing-library/react";
import type { BaseSyntheticEvent, ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import { createCvMock, createInput } from "../cvForm.mocks";
import { useCreateCvForm } from "./useCreateCvForm";

// The submit handler only needs these two methods of the form event.
const fakeEvent = { preventDefault: () => undefined, persist: () => undefined };

// renderWithProviders renders elements; this small component lets the hook run inside the same providers.
function setup(options: RenderWithProvidersOptions) {
  let current!: ReturnType<typeof useCreateCvForm>;
  function Probe(): ReactNode {
    current = useCreateCvForm();
    return null;
  }
  renderWithProviders(<Probe />, options);
  return { result: () => current };
}

describe("useCreateCvForm", () => {
  it("opens with empty values", () => {
    const { result } = setup({ mocks: [] });

    act(() => result().open());

    expect(result().isOpen).toBe(true);
    expect(result().form.getValues()).toEqual({ name: "", education: "", description: "" });
  });

  it("sends one request when submit is called twice in the same tick", async () => {
    // One create mock: a second request would find no mock and the modal would show the general error.
    const slowCreate = { ...createCvMock(createInput), delay: 20 };
    const { result } = setup({ mocks: [slowCreate] });
    act(() => {
      result().open();
      result().form.setValue("name", createInput.name);
      result().form.setValue("education", createInput.education);
      result().form.setValue("description", createInput.description);
    });

    await act(async () => {
      const event = fakeEvent as unknown as BaseSyntheticEvent;
      await Promise.all([result().submit(event), result().submit(event)]);
    });

    expect(result().failed).toBe(false);
    expect(result().isOpen).toBe(false);
    expect(await screen.findByText("CV created")).toBeInTheDocument();
  });
});
