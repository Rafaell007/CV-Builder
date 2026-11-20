import { CombinedGraphQLErrors } from "@apollo/client";
import { act, screen } from "@testing-library/react";
import type { BaseSyntheticEvent, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/shared/testing";
import { databasesCategory, frontendCategory } from "../skills.mocks";
import type { SkillInput, SkillListItem } from "../skills.types";
import { useUpdateSkillForm } from "./useUpdateSkillForm";

const event = { preventDefault: () => {} } as BaseSyntheticEvent;

const react: SkillListItem = {
  __typename: "Skill",
  id: "1",
  name: "React",
  category: frontendCategory,
};

function setup(update: (id: string, input: SkillInput) => Promise<SkillListItem>) {
  let current!: ReturnType<typeof useUpdateSkillForm>;
  function Probe(): ReactNode {
    current = useUpdateSkillForm(update);
    return null;
  }
  renderWithProviders(<Probe />);
  const submit = () => act(() => current.submit(event));
  return { result: () => current, submit };
}

describe("useUpdateSkillForm", () => {
  it("opens the form filled with the name and category of the skill, unchanged", () => {
    const { result } = setup(vi.fn());

    act(() => result().open(react));

    expect(result().isOpen).toBe(true);
    expect(result().form.getValues()).toEqual({ name: "React", categoryId: "c1" });
    expect(result().hasChanged).toBe(false);
  });

  it("sends the id and the new values, closes and shows a toast with the saved name", async () => {
    const update = vi.fn().mockResolvedValue({ ...react, name: "React.js" });
    const { result, submit } = setup(update);
    act(() => result().open(react));
    act(() => {
      result().form.setValue("name", " React.js ", { shouldDirty: true });
      result().form.setValue("categoryId", databasesCategory.id, { shouldDirty: true });
    });

    await submit();

    expect(update).toHaveBeenCalledExactlyOnceWith("1", { name: "React.js", categoryId: "c2" });
    expect(result().isOpen).toBe(false);
    expect(await screen.findByText("React.js was saved.")).toBeInTheDocument();
  });

  it("stays open and shows a missing category under the category field", async () => {
    const missing = new CombinedGraphQLErrors({
      errors: [
        {
          message: "Bad input",
          extensions: {
            code: "BAD_USER_INPUT",
            fieldErrors: [{ field: "categoryId", messages: ["Category not found"] }],
          },
        },
      ],
    });
    const { result, submit } = setup(vi.fn().mockRejectedValue(missing));
    act(() => result().open(react));
    act(() => result().form.setValue("categoryId", "c2", { shouldDirty: true }));

    await submit();

    expect(result().isOpen).toBe(true);
    expect(result().form.getValues("categoryId")).toBe("c2");
    expect(result().form.getFieldState("categoryId").error?.message).toBe("Category not found");
    expect(result().failed).toBe(false);
  });

  it("stays open and shows the general message for another error", async () => {
    const { result, submit } = setup(vi.fn().mockRejectedValue(new Error("Failed to fetch")));
    act(() => result().open(react));

    await submit();

    expect(result().isOpen).toBe(true);
    expect(result().failed).toBe(true);
    expect(screen.queryByText(/was saved/)).not.toBeInTheDocument();
  });
});
