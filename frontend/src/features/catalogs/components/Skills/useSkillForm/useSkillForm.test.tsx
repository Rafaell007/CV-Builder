import { CombinedGraphQLErrors } from "@apollo/client";
import { act, waitFor } from "@testing-library/react";
import type { BaseSyntheticEvent, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/shared/testing";
import type { SkillFormValues } from "../skills.types";
import { useSkillForm } from "./useSkillForm";

const event = { preventDefault: () => {} } as BaseSyntheticEvent;

const refused = (extensions: Record<string, unknown>) =>
  new CombinedGraphQLErrors({ errors: [{ message: "Refused", extensions }] });

// renderWithProviders renders elements; this small component lets the hook run inside the same providers.
function setup() {
  let current!: ReturnType<typeof useSkillForm>;
  function Probe(): ReactNode {
    current = useSkillForm();
    return null;
  }
  renderWithProviders(<Probe />);
  const fill = (field: keyof SkillFormValues, value: string) =>
    act(() => current.form.setValue(field, value, { shouldValidate: true, shouldDirty: true }));
  return { result: () => current, fill };
}

describe("useSkillForm", () => {
  it("sends the trimmed name and the category on submit", async () => {
    const { result, fill } = setup();
    const send = vi.fn().mockResolvedValue(undefined);
    await fill("name", "  React ");
    await fill("categoryId", "c1");

    await act(() => result().submit(event, send));

    expect(send).toHaveBeenCalledExactlyOnceWith({ name: "React", categoryId: "c1" });
  });

  it("does not send without a name or a category and shows both messages", async () => {
    const { result } = setup();
    const send = vi.fn();

    await act(() => result().submit(event, send));

    expect(send).not.toHaveBeenCalled();
    expect(result().form.getFieldState("name").error?.message).toBe("Skill is required");
    expect(result().form.getFieldState("categoryId").error?.message).toBe("Category is required");
  });

  it("ignores a second submit while the first one runs", async () => {
    const { result, fill } = setup();
    let finish!: () => void;
    const send = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    await fill("name", "React");
    await fill("categoryId", "c1");

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

  it("counts a new category or a new trimmed name as a change, but not added spaces", async () => {
    const { result, fill } = setup();
    act(() => result().reset({ name: "React", categoryId: "c1" }));
    expect(result().hasChanged).toBe(false);

    await fill("name", "React ");
    expect(result().hasChanged).toBe(false);

    await fill("categoryId", "c2");
    expect(result().hasChanged).toBe(true);

    await fill("categoryId", "c1");
    await fill("name", "Vue");
    expect(result().hasChanged).toBe(true);
  });

  it("shows CONFLICT under the name, keeps the values and shows no general message", async () => {
    const { result, fill } = setup();
    await fill("name", "React");
    await fill("categoryId", "c1");

    act(() => result().showError(refused({ code: "CONFLICT" })));

    expect(result().form.getFieldState("name").error?.message).toBe("Skill already exists");
    expect(result().form.getValues()).toEqual({ name: "React", categoryId: "c1" });
    expect(result().failed).toBe(false);
  });

  it("shows a missing category (BAD_USER_INPUT on categoryId) under the category", () => {
    const { result } = setup();

    act(() =>
      result().showError(
        refused({
          code: "BAD_USER_INPUT",
          fieldErrors: [{ field: "categoryId", messages: ["Category not found"] }],
        }),
      ),
    );

    expect(result().form.getFieldState("categoryId").error?.message).toBe("Category not found");
    expect(result().failed).toBe(false);
  });

  it("shows a BAD_USER_INPUT error of the name under the name", () => {
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

    act(() => result().reset({ name: "Git", categoryId: "c3" }));

    expect(result().failed).toBe(false);
    expect(result().form.getValues()).toEqual({ name: "Git", categoryId: "c3" });
    expect(result().form.formState.isDirty).toBe(false);
  });
});
