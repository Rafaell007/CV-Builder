import { act, screen } from "@testing-library/react";
import type { BaseSyntheticEvent, ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import {
  createCvInvalidMock,
  createCvMock,
  createCvNetworkErrorMock,
  createInput,
} from "../cvForm.mocks";
import { useCreateCvForm } from "./useCreateCvForm";

// The submit handler only needs these two methods of the form event.
const fakeEvent = { preventDefault: () => undefined, persist: () => undefined };

// renderWithProviders renders elements; this small component lets the hook run inside the same providers.
function setup(options: RenderWithProvidersOptions, userId?: string) {
  let current!: ReturnType<typeof useCreateCvForm>;
  function Probe(): ReactNode {
    current = useCreateCvForm(userId);
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

  it("sends the owner given by the page (the User CVs tab)", async () => {
    // The mock matches only a request with userId "10": any other input finds no mock and fails.
    const { result } = setup({ mocks: [createCvMock({ ...createInput, userId: "10" })] }, "10");
    act(() => {
      result().open();
      result().form.setValue("name", createInput.name);
      result().form.setValue("education", createInput.education);
      result().form.setValue("description", createInput.description);
    });

    await act(async () => {
      await result().submit(fakeEvent as unknown as BaseSyntheticEvent);
    });

    expect(result().failed).toBe(false);
    expect(result().isOpen).toBe(false);
  });

  describe("when the request fails", () => {
    type Result = () => ReturnType<typeof useCreateCvForm>;

    function openAndFill(result: Result) {
      act(() => {
        result().open();
        result().form.setValue("name", createInput.name);
        result().form.setValue("education", createInput.education);
        result().form.setValue("description", createInput.description);
      });
    }

    async function submit(result: Result) {
      await act(() => result().submit(fakeEvent as unknown as BaseSyntheticEvent));
    }

    it("shows a BAD_USER_INPUT error under its field, keeps the values and the modal open", async () => {
      const { result } = setup({ mocks: [createCvInvalidMock(createInput, "name")] });
      openAndFill(result);
      await submit(result);

      expect(result().form.getFieldState("name").error?.message).toBeTruthy();
      expect(result().failed).toBe(false);
      expect(result().isOpen).toBe(true);
      expect(result().form.getValues()).toEqual(createInput);
      expect(screen.queryByText("CV created")).not.toBeInTheDocument();
    });

    it("keeps the values and the modal open after a network failure and sets failed", async () => {
      const { result } = setup({ mocks: [createCvNetworkErrorMock(createInput)] });
      openAndFill(result);
      await submit(result);

      expect(result().failed).toBe(true);
      expect(result().isOpen).toBe(true);
      expect(result().form.getValues()).toEqual(createInput);
      expect(screen.queryByText("CV created")).not.toBeInTheDocument();
    });

    it("accepts a second submit after a failure", async () => {
      const { result } = setup({
        mocks: [createCvNetworkErrorMock(createInput), createCvMock(createInput)],
      });
      openAndFill(result);
      await submit(result);
      expect(result().failed).toBe(true);

      await submit(result);

      expect(result().failed).toBe(false);
      expect(result().isOpen).toBe(false);
      expect(await screen.findByText("CV created")).toBeInTheDocument();
    });
  });
});
