import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/shared/testing";
import { frontendCategory, sampleCategories } from "../skills.mocks";
import type { SkillInput, SkillListItem } from "../skills.types";
import { useCreateSkillForm } from "../useCreateSkillForm";
import type { UseSkillCategoriesResult } from "../useSkillCategories";
import { useUpdateSkillForm } from "../useUpdateSkillForm";
import { SkillFormModal } from "./SkillFormModal";

const react: SkillListItem = {
  __typename: "Skill",
  id: "1",
  name: "React",
  category: frontendCategory,
};

const loaded = (changes: Partial<UseSkillCategoriesResult> = {}): UseSkillCategoriesResult => ({
  categories: sampleCategories,
  loading: false,
  failed: false,
  retry: vi.fn(),
  ...changes,
});

interface CreateHarnessProps {
  create?: (input: SkillInput) => Promise<SkillListItem>;
  categories?: UseSkillCategoriesResult;
}

// The modal takes the state of a real flow hook, so the test drives it like the page does.
function CreateHarness({ create = vi.fn(), categories = loaded() }: CreateHarnessProps) {
  const creation = useCreateSkillForm(create);
  return (
    <>
      <button type="button" onClick={creation.open}>
        Open
      </button>
      <SkillFormModal kind="create" skillForm={creation} categories={categories} />
    </>
  );
}

function UpdateHarness({
  update,
}: {
  update: (id: string, input: SkillInput) => Promise<SkillListItem>;
}) {
  const editing = useUpdateSkillForm(update);
  return (
    <>
      <button type="button" onClick={() => editing.open(react)}>
        Open
      </button>
      <SkillFormModal kind="update" skillForm={editing} categories={loaded()} />
    </>
  );
}

async function openDialog(user: ReturnType<typeof renderWithProviders>["user"], name: string) {
  await user.click(screen.getByRole("button", { name: "Open" }));
  return screen.findByRole("dialog", { name });
}

describe("SkillFormModal", () => {
  it("is closed until the flow opens it", () => {
    renderWithProviders(<CreateHarness />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("create: sends the typed name and the chosen category, and Create waits for both", async () => {
    const create = vi.fn().mockResolvedValue(react);
    const { user } = renderWithProviders(<CreateHarness create={create} />);
    const dialog = await openDialog(user, "Create skill");
    const submit = within(dialog).getByRole("button", { name: "Create" });

    expect(submit).toBeDisabled();
    await user.type(within(dialog).getByRole("textbox", { name: "Name" }), "React");
    expect(submit).toBeDisabled();

    await user.click(within(dialog).getByRole("combobox", { name: "Category" }));
    await user.click(screen.getByRole("option", { name: "Frontend" }));
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    expect(create).toHaveBeenCalledExactlyOnceWith({ name: "React", categoryId: "c1" });
  });

  it("disables the Category field while the categories load", async () => {
    const { user } = renderWithProviders(
      <CreateHarness categories={loaded({ categories: undefined, loading: true })} />,
    );
    const dialog = await openDialog(user, "Create skill");

    expect(within(dialog).getByRole("combobox", { name: "Category" })).toBeDisabled();
  });

  it("says when the categories failed, and Retry loads them again", async () => {
    const retry = vi.fn();
    const { user } = renderWithProviders(
      <CreateHarness categories={loaded({ categories: undefined, failed: true, retry })} />,
    );
    const dialog = await openDialog(user, "Create skill");

    expect(within(dialog).getByRole("combobox", { name: "Category" })).toBeDisabled();
    expect(within(dialog).getByRole("alert")).toHaveTextContent("Could not load the categories");

    await user.click(within(dialog).getByRole("button", { name: "Retry" }));

    expect(retry).toHaveBeenCalledOnce();
  });

  it("update: shows the skill's name and category, and Update waits for a change", async () => {
    const update = vi.fn().mockResolvedValue(react);
    const { user } = renderWithProviders(<UpdateHarness update={update} />);
    const dialog = await openDialog(user, "Update skill");
    const submit = within(dialog).getByRole("button", { name: "Update" });

    expect(within(dialog).getByRole("textbox", { name: "Name" })).toHaveValue("React");
    expect(within(dialog).getByRole("combobox", { name: "Category" })).toHaveTextContent(
      "Frontend",
    );
    expect(submit).toBeDisabled();

    await user.click(within(dialog).getByRole("combobox", { name: "Category" }));
    await user.click(screen.getByRole("option", { name: "Tools" }));
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    expect(update).toHaveBeenCalledExactlyOnceWith("1", { name: "React", categoryId: "c3" });
  });

  it("shows the general message when the request fails for another reason", async () => {
    const create = vi.fn().mockRejectedValue(new Error("Failed to fetch"));
    const { user } = renderWithProviders(<CreateHarness create={create} />);
    const dialog = await openDialog(user, "Create skill");

    await user.type(within(dialog).getByRole("textbox", { name: "Name" }), "React");
    await user.click(within(dialog).getByRole("combobox", { name: "Category" }));
    await user.click(screen.getByRole("option", { name: "Frontend" }));
    const submit = within(dialog).getByRole("button", { name: "Create" });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "Something went wrong. Please try again later",
    );
  });
});
