import { act, screen } from "@testing-library/react";
import type { BaseSyntheticEvent, ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import {
  backendCv,
  updateCvInvalidMock,
  updateCvMock,
  updateCvNetworkErrorMock,
} from "../cvForm.mocks";
import { useUpdateCvForm } from "./useUpdateCvForm";

// The submit handler only needs these two methods of the form event.
const fakeEvent = { preventDefault: () => undefined, persist: () => undefined };

// renderWithProviders renders elements; this small component lets the hook run inside the same providers.
function setup(options: RenderWithProvidersOptions, userId?: string) {
  let current!: ReturnType<typeof useUpdateCvForm>;
  function Probe(): ReactNode {
    current = useUpdateCvForm(userId);
    return null;
  }
  renderWithProviders(<Probe />, options);
  return { result: () => current };
}

const input = {
  id: "1",
  name: "Backend CV 2",
  education: backendCv.education,
  description: backendCv.description,
};

describe("useUpdateCvForm", () => {
  it("fills the form with the CV when it opens", () => {
    const { result } = setup({ mocks: [] });

    act(() => result().open(backendCv));

    expect(result().isOpen).toBe(true);
    expect(result().form.getValues()).toEqual({
      name: "Backend CV",
      education: "MSc Computer Science",
      description: "Five years of Node.js",
    });
  });

  it("sends one request when submit is called twice in the same tick", async () => {
    // One update mock: a second request would find no mock and the modal would show the general error.
    const slowUpdate = { ...updateCvMock(input), delay: 20 };
    const { result } = setup({ mocks: [slowUpdate] });
    act(() => {
      result().open(backendCv);
      result().form.setValue("name", "Backend CV 2", { shouldDirty: true });
    });

    await act(async () => {
      const event = fakeEvent as unknown as BaseSyntheticEvent;
      await Promise.all([result().submit(event), result().submit(event)]);
    });

    expect(result().failed).toBe(false);
    expect(result().isOpen).toBe(false);
    expect(await screen.findByText("CV updated")).toBeInTheDocument();
  });

  it("sends the employee of the User CVs tab, not the owner of the row", async () => {
    // The mock matches only a request with userId "10" (the page); the row belongs to user "3".
    const { result } = setup({ mocks: [updateCvMock({ ...input, userId: "10" })] }, "10");
    act(() => {
      result().open(backendCv);
      result().form.setValue("name", "Backend CV 2", { shouldDirty: true });
    });

    await act(async () => {
      await result().submit(fakeEvent as unknown as BaseSyntheticEvent);
    });

    expect(result().failed).toBe(false);
    expect(result().isOpen).toBe(false);
  });

  describe("when the request fails", () => {
    type Result = () => ReturnType<typeof useUpdateCvForm>;

    function openAndEdit(result: Result) {
      act(() => {
        result().open(backendCv);
        result().form.setValue("name", "Backend CV 2", { shouldDirty: true });
      });
    }

    async function submit(result: Result) {
      await act(() => result().submit(fakeEvent as unknown as BaseSyntheticEvent));
    }

    const typed = {
      name: "Backend CV 2",
      education: backendCv.education,
      description: backendCv.description,
    };

    it("shows a BAD_USER_INPUT error under its field, keeps the values and the modal open", async () => {
      const { result } = setup({ mocks: [updateCvInvalidMock(input, "name")] });
      openAndEdit(result);
      await submit(result);

      expect(result().form.getFieldState("name").error?.message).toBeTruthy();
      expect(result().failed).toBe(false);
      expect(result().isOpen).toBe(true);
      expect(result().form.getValues()).toEqual(typed);
      expect(screen.queryByText("CV updated")).not.toBeInTheDocument();
    });

    it("keeps the values and the modal open after a network failure and sets failed", async () => {
      const { result } = setup({ mocks: [updateCvNetworkErrorMock(input)] });
      openAndEdit(result);
      await submit(result);

      expect(result().failed).toBe(true);
      expect(result().isOpen).toBe(true);
      expect(result().form.getValues()).toEqual(typed);
      expect(screen.queryByText("CV updated")).not.toBeInTheDocument();
    });

    it("accepts a second submit after a failure", async () => {
      const { result } = setup({ mocks: [updateCvNetworkErrorMock(input), updateCvMock(input)] });
      openAndEdit(result);
      await submit(result);
      expect(result().failed).toBe(true);

      await submit(result);

      expect(result().failed).toBe(false);
      expect(result().isOpen).toBe(false);
      expect(await screen.findByText("CV updated")).toBeInTheDocument();
    });
  });
});
