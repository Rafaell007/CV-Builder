import { CombinedGraphQLErrors } from "@apollo/client";
import { act, screen } from "@testing-library/react";
import type { BaseSyntheticEvent, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/shared/testing";
import { ISO_TAKEN_REASON } from "../languages.constants";
import { english } from "../languages.mocks";
import type { LanguageFormValues, LanguageInput, LanguageListItem } from "../languages.types";
import { useCreateLanguageForm } from "./useCreateLanguageForm";

const event = { preventDefault: () => {} } as BaseSyntheticEvent;
const empty: LanguageFormValues = { name: "", iso: "", nativeName: "" };
const typed: LanguageFormValues = { name: "English", iso: "EN", nativeName: "English" };

function setup(create: (input: LanguageInput) => Promise<LanguageListItem>) {
  let current!: ReturnType<typeof useCreateLanguageForm>;
  function Probe(): ReactNode {
    current = useCreateLanguageForm(create);
    return null;
  }
  renderWithProviders(<Probe />);
  const submitValues = async ({ name, iso, nativeName }: LanguageFormValues) => {
    act(() => {
      current.form.setValue("name", name, { shouldDirty: true });
      current.form.setValue("iso", iso, { shouldDirty: true });
      current.form.setValue("nativeName", nativeName, { shouldDirty: true });
    });
    await act(() => current.submit(event));
  };
  return { result: () => current, submitValues };
}

describe("useCreateLanguageForm", () => {
  it("opens an empty form", () => {
    const { result } = setup(vi.fn());

    act(() => result().open());

    expect(result().isOpen).toBe(true);
    expect(result().form.getValues()).toEqual(empty);
  });

  it("closes and shows a toast with the saved name after a successful request", async () => {
    const create = vi.fn().mockResolvedValue(english);
    const { result, submitValues } = setup(create);
    act(() => result().open());

    await submitValues({ name: " English ", iso: " en ", nativeName: " English " });

    expect(create).toHaveBeenCalledExactlyOnceWith(typed);
    expect(result().isOpen).toBe(false);
    expect(await screen.findByText("English was added to the languages.")).toBeInTheDocument();
  });

  it("stays open, keeps the values and shows no toast when the name is taken", async () => {
    const taken = new CombinedGraphQLErrors({
      errors: [{ message: "Exists", extensions: { code: "CONFLICT" } }],
    });
    const { result, submitValues } = setup(vi.fn().mockRejectedValue(taken));
    act(() => result().open());

    await submitValues(typed);

    expect(result().isOpen).toBe(true);
    expect(result().form.getValues()).toEqual(typed);
    expect(result().form.getFieldState("name").error?.message).toBe("Language already exists");
    expect(screen.queryByText(/was added/)).not.toBeInTheDocument();
  });

  it("stays open and shows a taken ISO code under the ISO field", async () => {
    const taken = new CombinedGraphQLErrors({
      errors: [{ message: "Exists", extensions: { code: "CONFLICT", reason: ISO_TAKEN_REASON } }],
    });
    const { result, submitValues } = setup(vi.fn().mockRejectedValue(taken));
    act(() => result().open());

    await submitValues(typed);

    expect(result().isOpen).toBe(true);
    expect(result().form.getFieldState("iso").error?.message).toBe("ISO code already exists");
    expect(result().form.getFieldState("name").error).toBeUndefined();
  });

  it("stays open, keeps the values and shows the general message for another error", async () => {
    const { result, submitValues } = setup(vi.fn().mockRejectedValue(new Error("Failed to fetch")));
    act(() => result().open());

    await submitValues(typed);

    expect(result().isOpen).toBe(true);
    expect(result().form.getValues()).toEqual(typed);
    expect(result().failed).toBe(true);
  });

  it("is empty again when the modal opens a second time", async () => {
    const { result, submitValues } = setup(vi.fn().mockRejectedValue(new Error("Failed to fetch")));
    act(() => result().open());
    await submitValues(typed);

    act(() => result().setOpen(false));
    act(() => result().open());

    expect(result().form.getValues()).toEqual(empty);
    expect(result().failed).toBe(false);
  });
});
