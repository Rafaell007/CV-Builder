import { CombinedGraphQLErrors } from "@apollo/client";
import { act, waitFor } from "@testing-library/react";
import type { BaseSyntheticEvent, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/shared/testing";
import { useCatalogNameForm } from "./useCatalogNameForm";

const event = { preventDefault: () => {} } as BaseSyntheticEvent;

const refused = (extensions: Record<string, unknown>) =>
  new CombinedGraphQLErrors({ errors: [{ message: "Refused", extensions }] });

// renderWithProviders renders elements; this small component lets the hook run inside the same providers.
function setup() {
  let current!: ReturnType<typeof useCatalogNameForm>;
  function Probe(): ReactNode {
    current = useCatalogNameForm("catalogs.departments");
    return null;
  }
  renderWithProviders(<Probe />);
  const type = (name: string) =>
    act(() => current.form.setValue("name", name, { shouldValidate: true, shouldDirty: true }));
  return { result: () => current, type };
}

describe("useCatalogNameForm", () => {
  it("sends the trimmed name on submit", async () => {
    const { result, type } = setup();
    const send = vi.fn().mockResolvedValue(undefined);
    await type("  Design ");

    await act(() => result().submit(event, send));

    expect(send).toHaveBeenCalledExactlyOnceWith("Design");
  });

  it("does not send a name of spaces and shows the required message", async () => {
    const { result, type } = setup();
    const send = vi.fn();
    await type("   ");

    await act(() => result().submit(event, send));

    expect(send).not.toHaveBeenCalled();
    expect(result().form.getFieldState("name").error?.message).toBe("Department name is required");
  });

  it("ignores a second submit while the first one runs", async () => {
    const { result, type } = setup();
    let finish!: () => void;
    const send = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    await type("Design");

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

  it("shows CONFLICT under the field, keeps the name and shows no general message", async () => {
    const { result, type } = setup();
    await type("Design");

    act(() => result().showError(refused({ code: "CONFLICT" })));

    expect(result().form.getFieldState("name").error?.message).toBe("Department already exists");
    expect(result().form.getValues("name")).toBe("Design");
    expect(result().failed).toBe(false);
  });

  it("shows a BAD_USER_INPUT error of the name under the field", () => {
    const { result } = setup();

    act(() =>
      result().showError(
        refused({
          code: "BAD_USER_INPUT",
          fieldErrors: [{ field: "name", messages: ["name is too long"] }],
        }),
      ),
    );

    expect(result().form.getFieldState("name").error?.message).toBe(
      "The server did not accept this value",
    );
    expect(result().failed).toBe(false);
  });

  it("shows the general message for any other error, and reset clears it", async () => {
    const { result } = setup();

    act(() => result().showError(new Error("Failed to fetch")));
    await waitFor(() => expect(result().failed).toBe(true));
    expect(result().form.getFieldState("name").error).toBeUndefined();

    act(() => result().reset("Finance"));

    expect(result().failed).toBe(false);
    expect(result().form.getValues("name")).toBe("Finance");
    expect(result().form.formState.isDirty).toBe(false);
  });
});
