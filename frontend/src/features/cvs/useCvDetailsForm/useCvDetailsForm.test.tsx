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
import { useCvDetailsForm } from "./useCvDetailsForm";

// The submit handler only needs these two methods of the form event.
const fakeEvent = { preventDefault: () => undefined, persist: () => undefined };
const event = fakeEvent as unknown as BaseSyntheticEvent;

// renderWithProviders renders elements; this small component lets the hook run inside the same providers.
function setup(options: RenderWithProvidersOptions) {
  let current!: ReturnType<typeof useCvDetailsForm>;
  function Probe(): ReactNode {
    current = useCvDetailsForm(backendCv);
    return null;
  }
  renderWithProviders(<Probe />, options);
  return { result: () => current };
}

const input = {
  id: backendCv.id,
  name: "Backend CV 2",
  education: backendCv.education,
  description: backendCv.description,
};

/** Types a value the way the user does: the field becomes changed and is checked at once. */
async function change(result: () => ReturnType<typeof useCvDetailsForm>, value: string) {
  await act(async () => {
    result().form.setValue("name", value, { shouldDirty: true, shouldValidate: true });
  });
}

describe("useCvDetailsForm", () => {
  it("starts with the values of the CV and UPDATE disabled", () => {
    const { result } = setup({ mocks: [] });

    expect(result().form.getValues()).toEqual({
      name: "Backend CV",
      education: "MSc Computer Science",
      description: "Five years of Node.js",
    });
    expect(result().canUpdate).toBe(false);
  });

  it("enables UPDATE after a change, and disables it again when the value is changed back", async () => {
    const { result } = setup({ mocks: [] });

    await change(result, "Backend CV 2");
    expect(result().canUpdate).toBe(true);

    await change(result, "Backend CV");
    expect(result().canUpdate).toBe(false);
  });

  it("disables UPDATE while a value is not valid", async () => {
    const { result } = setup({ mocks: [] });

    await change(result, "   ");

    expect(result().canUpdate).toBe(false);
  });

  it("keeps the saved values and disables UPDATE after a successful update", async () => {
    const { result } = setup({ mocks: [updateCvMock(input)] });
    await change(result, "Backend CV 2");

    await act(async () => {
      await result().submit(event);
    });

    expect(result().form.getValues("name")).toBe("Backend CV 2");
    expect(result().canUpdate).toBe(false);
    expect(result().failed).toBe(false);
    expect(await screen.findByText("CV updated")).toBeInTheDocument();
  });

  it("keeps the typed values and UPDATE enabled after a failed update", async () => {
    const { result } = setup({ mocks: [updateCvNetworkErrorMock(input)] });
    await change(result, "Backend CV 2");

    await act(async () => {
      await result().submit(event);
    });

    expect(result().failed).toBe(true);
    expect(result().form.getValues("name")).toBe("Backend CV 2");
    expect(result().canUpdate).toBe(true);
  });

  it("shows a field error of the backend under its field and keeps the values", async () => {
    const { result } = setup({ mocks: [updateCvInvalidMock(input, "name")] });
    await change(result, "Backend CV 2");

    await act(async () => {
      await result().submit(event);
    });

    expect(result().form.formState.errors.name).toBeDefined();
    expect(result().form.getValues("name")).toBe("Backend CV 2");
  });

  it("sends one request when submit is called twice in the same tick", async () => {
    // One update mock: a second request would find no mock and the form would show the general error.
    const slowUpdate = { ...updateCvMock(input), delay: 20 };
    const { result } = setup({ mocks: [slowUpdate] });
    await change(result, "Backend CV 2");

    await act(async () => {
      await Promise.all([result().submit(event), result().submit(event)]);
    });

    expect(result().failed).toBe(false);
    expect(await screen.findByText("CV updated")).toBeInTheDocument();
  });
});
