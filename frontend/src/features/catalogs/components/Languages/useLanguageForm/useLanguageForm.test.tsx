import { CombinedGraphQLErrors } from "@apollo/client";
import { act, waitFor } from "@testing-library/react";
import type { BaseSyntheticEvent, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/shared/testing";
import type { LanguageFormValues } from "../languages.types";
import { useLanguageForm } from "./useLanguageForm";

const event = { preventDefault: () => {} } as BaseSyntheticEvent;

const refused = (extensions: Record<string, unknown>) =>
  new CombinedGraphQLErrors({ errors: [{ message: "Refused", extensions }] });

const ENGLISH: LanguageFormValues = { name: "English", iso: "EN", nativeName: "English" };

// renderWithProviders renders elements; this small component lets the hook run inside the same providers.
function setup() {
  let current!: ReturnType<typeof useLanguageForm>;
  function Probe(): ReactNode {
    current = useLanguageForm();
    return null;
  }
  renderWithProviders(<Probe />);
  const fill = (field: keyof LanguageFormValues, value: string) =>
    act(() => current.form.setValue(field, value, { shouldValidate: true, shouldDirty: true }));
  const fillAll = async (values: LanguageFormValues) => {
    await fill("name", values.name);
    await fill("iso", values.iso);
    await fill("nativeName", values.nativeName);
  };
  return { result: () => current, fill, fillAll };
}

describe("useLanguageForm", () => {
  it("sends the trimmed values with an uppercase ISO code on submit", async () => {
    const { result, fillAll } = setup();
    const send = vi.fn().mockResolvedValue(undefined);
    await fillAll({ name: " German ", iso: " de", nativeName: "Deutsch " });

    await act(() => result().submit(event, send));

    expect(send).toHaveBeenCalledExactlyOnceWith({
      name: "German",
      iso: "DE",
      nativeName: "Deutsch",
    });
  });

  it("does not send an empty form and shows the three messages", async () => {
    const { result } = setup();
    const send = vi.fn();

    await act(() => result().submit(event, send));

    expect(send).not.toHaveBeenCalled();
    const errorOf = (field: keyof LanguageFormValues) =>
      result().form.getFieldState(field).error?.message;
    expect(errorOf("name")).toBe("Name is required");
    expect(errorOf("iso")).toBe("ISO is required");
    expect(errorOf("nativeName")).toBe("Native name is required");
  });

  it("does not send an invalid ISO code", async () => {
    const { result, fillAll } = setup();
    const send = vi.fn();
    await fillAll({ ...ENGLISH, iso: "E1" });

    await act(() => result().submit(event, send));

    expect(send).not.toHaveBeenCalled();
    expect(result().form.getFieldState("iso").error?.message).toBe(
      "ISO may contain only the letters A-Z and one hyphen",
    );
  });

  it("ignores a second submit while the first one runs", async () => {
    const { result, fillAll } = setup();
    let finish!: () => void;
    const send = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    await fillAll(ENGLISH);

    let first!: Promise<void>;
    act(() => {
      first = result().submit(event, send);
    });
    await act(() => result().submit(event, send));
    await act(async () => {
      finish();
      await first;
    });

    expect(send).toHaveBeenCalledOnce();
  });

  it("counts a new trimmed value as a change, but not added spaces or a lowercase ISO code", async () => {
    const { result, fill } = setup();
    act(() => result().reset(ENGLISH));
    expect(result().hasChanged).toBe(false);

    await fill("name", "English ");
    await fill("iso", "en");
    expect(result().hasChanged).toBe(false);

    await fill("nativeName", "Inglés");
    expect(result().hasChanged).toBe(true);

    await fill("nativeName", "English");
    await fill("iso", "EN-GB");
    expect(result().hasChanged).toBe(true);
  });

  it("does not count extra spaces inside the name as a change, like the backend", async () => {
    const { result, fill } = setup();
    act(() => result().reset({ name: "Old English", iso: "ANG", nativeName: "Englisc" }));

    await fill("name", "Old   English");
    expect(result().hasChanged).toBe(false);
  });

  it("shows CONFLICT with reason ISO_TAKEN under the ISO code and keeps the values", async () => {
    const { result, fillAll } = setup();
    await fillAll(ENGLISH);

    act(() => result().showError(refused({ code: "CONFLICT", reason: "ISO_TAKEN" })));

    expect(result().form.getFieldState("iso").error?.message).toBe("ISO code already exists");
    expect(result().form.getFieldState("name").error).toBeUndefined();
    expect(result().form.getValues()).toEqual(ENGLISH);
    expect(result().failed).toBe(false);
  });

  it("shows CONFLICT without a reason under the name", async () => {
    const { result, fillAll } = setup();
    await fillAll(ENGLISH);

    act(() => result().showError(refused({ code: "CONFLICT" })));

    expect(result().form.getFieldState("name").error?.message).toBe("Language already exists");
    expect(result().form.getFieldState("iso").error).toBeUndefined();
    expect(result().failed).toBe(false);
  });

  it("shows a BAD_USER_INPUT error under its field", () => {
    const { result } = setup();

    act(() =>
      result().showError(
        refused({
          code: "BAD_USER_INPUT",
          fieldErrors: [{ field: "nativeName", messages: ["nativeName is too long"] }],
        }),
      ),
    );

    expect(result().form.getFieldState("nativeName").error?.message).toBe(
      "The server did not accept this value",
    );
    expect(result().failed).toBe(false);
  });

  it("shows the general message for any other error, and reset clears it", async () => {
    const { result } = setup();

    act(() => result().showError(new Error("Failed to fetch")));
    await waitFor(() => expect(result().failed).toBe(true));
    expect(result().form.getFieldState("name").error).toBeUndefined();

    act(() => result().reset(ENGLISH));

    expect(result().failed).toBe(false);
    expect(result().form.getValues()).toEqual(ENGLISH);
    expect(result().form.formState.isDirty).toBe(false);
  });
});
