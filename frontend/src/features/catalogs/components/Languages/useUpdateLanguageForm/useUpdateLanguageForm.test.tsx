import { CombinedGraphQLErrors } from "@apollo/client";
import { act, screen } from "@testing-library/react";
import type { BaseSyntheticEvent, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/shared/testing";
import { german } from "../languages.mocks";
import type { LanguageInput, LanguageListItem } from "../languages.types";
import { useUpdateLanguageForm } from "./useUpdateLanguageForm";

const event = { preventDefault: () => {} } as BaseSyntheticEvent;

function setup(update: (id: string, input: LanguageInput) => Promise<LanguageListItem>) {
  let current!: ReturnType<typeof useUpdateLanguageForm>;
  function Probe(): ReactNode {
    current = useUpdateLanguageForm(update);
    return null;
  }
  renderWithProviders(<Probe />);
  const submit = () => act(() => current.submit(event));
  return { result: () => current, submit };
}

describe("useUpdateLanguageForm", () => {
  it("opens the form filled with the values of the language, unchanged", () => {
    const { result } = setup(vi.fn());

    act(() => result().open(german));

    expect(result().isOpen).toBe(true);
    expect(result().form.getValues()).toEqual({ name: "German", iso: "DE", nativeName: "Deutsch" });
    expect(result().hasChanged).toBe(false);
  });

  it("sends the id and the new values, closes and shows a toast with the saved name", async () => {
    const update = vi.fn().mockResolvedValue({ ...german, iso: "DE-AT" });
    const { result, submit } = setup(update);
    act(() => result().open(german));
    act(() => result().form.setValue("iso", " de-at ", { shouldDirty: true }));

    await submit();

    expect(update).toHaveBeenCalledExactlyOnceWith("2", {
      name: "German",
      iso: "DE-AT",
      nativeName: "Deutsch",
    });
    expect(result().isOpen).toBe(false);
    expect(await screen.findByText("German was saved.")).toBeInTheDocument();
  });

  it("stays open and shows a server field error under its field", async () => {
    const invalid = new CombinedGraphQLErrors({
      errors: [
        {
          message: "Bad input",
          extensions: {
            code: "BAD_USER_INPUT",
            fieldErrors: [{ field: "nativeName", messages: ["Too long"] }],
          },
        },
      ],
    });
    const { result, submit } = setup(vi.fn().mockRejectedValue(invalid));
    act(() => result().open(german));

    await submit();

    expect(result().isOpen).toBe(true);
    expect(result().form.getFieldState("nativeName").error?.message).toBe(
      "The server did not accept this value",
    );
    expect(result().failed).toBe(false);
  });

  it("stays open and shows the general message for another error", async () => {
    const { result, submit } = setup(vi.fn().mockRejectedValue(new Error("Failed to fetch")));
    act(() => result().open(german));

    await submit();

    expect(result().isOpen).toBe(true);
    expect(result().failed).toBe(true);
    expect(screen.queryByText(/was saved/)).not.toBeInTheDocument();
  });
});
