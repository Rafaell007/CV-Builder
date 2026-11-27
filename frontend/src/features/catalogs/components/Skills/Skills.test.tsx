import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/shared/testing";
import { Skills } from "./Skills";
import {
  createSkillMock,
  createSkillRefusedMock,
  deleteSkillMock,
  deleteSkillRefusedMock,
  git,
  postgres,
  react,
  skillCategoriesMock,
  skillsMock,
  toolsCategory,
  updateSkillMock,
} from "./skills.mocks";

// The page is the shared CatalogPage with the skill requests; Departments.test.tsx covers the shared behaviour in
// full, and SkillFormModal.test.tsx the fields of the modal. These tests check that each skill request, the Type and
// Category columns and every skill text are wired.
type User = ReturnType<typeof renderWithProviders>["user"];

/** The cells of each data row: Name, Type, Category (the row menu cell is left out). */
const rows = () =>
  screen
    .getAllByRole("row")
    .slice(1)
    .map((row) =>
      within(row)
        .getAllByRole("cell")
        .slice(0, 3)
        .map((cell) => cell.textContent),
    );

async function chooseCategory(user: User, dialog: HTMLElement, name: string) {
  const select = within(dialog).getByRole("combobox", { name: "Category" });
  // The field is disabled until the categories have loaded.
  await waitFor(() => expect(select).toBeEnabled());
  await user.click(select);
  await user.click(await screen.findByRole("option", { name }));
}

describe("Skills", () => {
  it("shows the skills of the backend with their type and category, in the Figma column order", async () => {
    renderWithProviders(<Skills />, { mocks: [skillsMock([react, postgres, git])] });

    expect(await screen.findByRole("table", { name: "Skills list" })).toBeInTheDocument();
    expect(await screen.findByText("React")).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader").map((header) => header.textContent)).toEqual(
      expect.arrayContaining(["Name", "Type", "Category"]),
    );
    expect(rows()).toEqual([
      ["React", "Technology", "Frontend"],
      ["PostgreSQL", "Technology", "Databases"],
      ["Git", "Tool", "Tools"],
    ]);
    expect(screen.getByRole("button", { name: "Actions for Git" })).toBeInTheDocument();
  });

  it("sorts by Name only", async () => {
    renderWithProviders(<Skills />, { mocks: [skillsMock([react])] });
    await screen.findByText("React");

    expect(screen.getByRole("button", { name: "Name" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Type" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Category" })).not.toBeInTheDocument();
  });

  it("shows No skills found and the Polish texts", async () => {
    renderWithProviders(<Skills />, { locale: "pl", mocks: [skillsMock([])] });

    expect(screen.getByRole("button", { name: "UTWÓRZ UMIEJĘTNOŚĆ" })).toBeInTheDocument();
    expect(await screen.findByText("Nie znaleziono umiejętności")).toBeInTheDocument();
  });

  it("creates a skill with a category and shows it after the reload", async () => {
    const created = { ...git, id: "new-1", name: "Vim" };
    const { user } = renderWithProviders(<Skills />, {
      mocks: [
        skillsMock([react]),
        skillCategoriesMock(),
        createSkillMock({ name: "Vim", categoryId: toolsCategory.id }),
        skillsMock([react, created]),
      ],
    });
    await screen.findByText("React");
    await user.click(screen.getByRole("button", { name: "CREATE SKILL" }));
    const dialog = await screen.findByRole("dialog", { name: "Create skill" });

    await user.type(within(dialog).getByRole("textbox", { name: "Name" }), "Vim");
    await chooseCategory(user, dialog, "Tools");
    await user.click(within(dialog).getByRole("button", { name: "Create" }));

    expect(await screen.findByText("Vim was added to the skills.")).toBeInTheDocument();
    await waitFor(() =>
      expect(rows()).toEqual([
        ["React", "Technology", "Frontend"],
        ["Vim", "Tool", "Tools"],
      ]),
    );
  });

  it("shows Skill already exists for a taken name", async () => {
    const input = { name: "react", categoryId: toolsCategory.id };
    const { user } = renderWithProviders(<Skills />, {
      mocks: [skillsMock([react]), skillCategoriesMock(), createSkillRefusedMock(input)],
    });
    await screen.findByText("React");
    await user.click(screen.getByRole("button", { name: "CREATE SKILL" }));
    const dialog = await screen.findByRole("dialog", { name: "Create skill" });

    await user.type(within(dialog).getByRole("textbox", { name: "Name" }), "react");
    await chooseCategory(user, dialog, "Tools");
    await user.click(within(dialog).getByRole("button", { name: "Create" }));

    expect(await within(dialog).findByText("Skill already exists")).toBeInTheDocument();
  });

  it("moves a skill to another category: the new type and category show after the reload", async () => {
    const { user } = renderWithProviders(<Skills />, {
      mocks: [
        skillsMock([react]),
        skillCategoriesMock(),
        updateSkillMock(react.id, { name: "React", categoryId: toolsCategory.id }),
        skillsMock([{ ...react, category: toolsCategory }]),
      ],
    });
    await user.click(await screen.findByRole("button", { name: "Actions for React" }));
    await user.click(screen.getByRole("menuitem", { name: "Edit" }));
    const dialog = await screen.findByRole("dialog", { name: "Update skill" });

    expect(within(dialog).getByRole("textbox", { name: "Name" })).toHaveValue("React");
    await chooseCategory(user, dialog, "Tools");
    await user.click(within(dialog).getByRole("button", { name: "Update" }));

    expect(await screen.findByText("React was saved.")).toBeInTheDocument();
    await waitFor(() => expect(rows()).toEqual([["React", "Tool", "Tools"]]));
  });

  it("deletes a skill", async () => {
    const { user } = renderWithProviders(<Skills />, {
      mocks: [skillsMock([react, git]), deleteSkillMock(react.id), skillsMock([git])],
    });
    await user.click(await screen.findByRole("button", { name: "Actions for React" }));
    await user.click(screen.getByRole("menuitem", { name: "Delete" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveTextContent("Are you sure you want to delete skill React?");

    await user.click(within(dialog).getByRole("button", { name: "Confirm" }));

    await waitFor(() => expect(rows()).toEqual([["Git", "Tool", "Tools"]]));
  });

  it("shows the in-use text for a skill that is in use", async () => {
    const { user } = renderWithProviders(<Skills />, {
      mocks: [skillsMock([react]), deleteSkillRefusedMock(react.id)],
    });
    await user.click(await screen.findByRole("button", { name: "Actions for React" }));
    await user.click(screen.getByRole("menuitem", { name: "Delete" }));
    await user.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Confirm" }),
    );

    expect(
      await screen.findByText("Skill cannot be deleted because it is currently in use"),
    ).toBeInTheDocument();
  });
});
