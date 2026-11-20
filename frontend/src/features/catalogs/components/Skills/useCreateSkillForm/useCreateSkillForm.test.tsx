import { CombinedGraphQLErrors } from "@apollo/client";
import { act, screen } from "@testing-library/react";
import type { BaseSyntheticEvent, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/shared/testing";
import type { SkillFormValues, SkillInput, SkillListItem } from "../skills.types";
import { frontendCategory } from "../skills.mocks";
import { useCreateSkillForm } from "./useCreateSkillForm";

const event = { preventDefault: () => {} } as BaseSyntheticEvent;

const savedReact: SkillListItem = {
  __typename: "Skill",
  id: "1",
  name: "React",
  category: frontendCategory,
};

function setup(create: (input: SkillInput) => Promise<SkillListItem>) {
  let current!: ReturnType<typeof useCreateSkillForm>;
  function Probe(): ReactNode {
    current = useCreateSkillForm(create);
    return null;
  }
  renderWithProviders(<Probe />);
  const submitValues = async ({ name, categoryId }: SkillFormValues) => {
    act(() => {
      current.form.setValue("name", name, { shouldDirty: true });
      current.form.setValue("categoryId", categoryId, { shouldDirty: true });
    });
    await act(() => current.submit(event));
  };
  return { result: () => current, submitValues };
}

describe("useCreateSkillForm", () => {
  it("opens an empty form", () => {
    const { result } = setup(vi.fn());

    act(() => result().open());

    expect(result().isOpen).toBe(true);
    expect(result().form.getValues()).toEqual({ name: "", categoryId: "" });
  });

  it("closes and shows a toast with the saved name after a successful request", async () => {
    const create = vi.fn().mockResolvedValue(savedReact);
    const { result, submitValues } = setup(create);
    act(() => result().open());

    await submitValues({ name: " React ", categoryId: "c1" });

    expect(create).toHaveBeenCalledExactlyOnceWith({ name: "React", categoryId: "c1" });
    expect(result().isOpen).toBe(false);
    expect(await screen.findByText("React was added to the skills.")).toBeInTheDocument();
  });

  it("stays open, keeps the values and shows no toast when the name is taken", async () => {
    const taken = new CombinedGraphQLErrors({
      errors: [{ message: "Exists", extensions: { code: "CONFLICT" } }],
    });
    const { result, submitValues } = setup(vi.fn().mockRejectedValue(taken));
    act(() => result().open());

    await submitValues({ name: "React", categoryId: "c1" });

    expect(result().isOpen).toBe(true);
    expect(result().form.getValues()).toEqual({ name: "React", categoryId: "c1" });
    expect(result().form.getFieldState("name").error?.message).toBe("Skill already exists");
    expect(screen.queryByText(/was added/)).not.toBeInTheDocument();
  });

  it("stays open, keeps the values and shows the general message for another error", async () => {
    const { result, submitValues } = setup(vi.fn().mockRejectedValue(new Error("Failed to fetch")));
    act(() => result().open());

    await submitValues({ name: "React", categoryId: "c1" });

    expect(result().isOpen).toBe(true);
    expect(result().form.getValues()).toEqual({ name: "React", categoryId: "c1" });
    expect(result().failed).toBe(true);
  });

  it("is empty again when the modal opens a second time", async () => {
    const { result, submitValues } = setup(vi.fn().mockRejectedValue(new Error("Failed to fetch")));
    act(() => result().open());
    await submitValues({ name: "React", categoryId: "c1" });

    act(() => result().setOpen(false));
    act(() => result().open());

    expect(result().form.getValues()).toEqual({ name: "", categoryId: "" });
    expect(result().failed).toBe(false);
  });
});
