import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Skills } from "./Skills";
import {
  fakeBackendMock,
  git,
  postgres,
  react,
  skillCategoriesMock,
  skillsErrorMock,
  skillsMock,
} from "./skills.mocks";

const desktop = { viewport: { value: "desktop", isRotated: false } };
const tablet = { viewport: { value: "tablet", isRotated: false } };

// The page is the shared CatalogPage; the Departments stories show every shared state and the Delete modal in full.
const sample = [react, postgres, git];
const body = within(document.body);

const meta = {
  title: "Features/Catalogs/Skills",
  component: Skills,
  parameters: { layout: "fullscreen" },
  globals: desktop,
} satisfies Meta<typeof Skills>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The list on a 1440px desktop screen: Name, Type and Category. */
export const Desktop: Story = {
  parameters: { apollo: { mocks: [fakeBackendMock(sample)] } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("React")).toBeInTheDocument();
    await expect(canvas.getByRole("columnheader", { name: "Type" })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "CREATE SKILL" })).toBeInTheDocument();
  },
};

/** The same list on a 768px tablet screen. */
export const Tablet: Story = {
  globals: tablet,
  parameters: { apollo: { mocks: [fakeBackendMock(sample)] } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Git")).toBeInTheDocument();
  },
};

export const Empty: Story = {
  parameters: { apollo: { mocks: [skillsMock([])] } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("No skills found")).toBeInTheDocument();
  },
};

export const LoadFailed: Story = {
  parameters: { apollo: { mocks: [skillsErrorMock()] } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("button", { name: "Retry" })).toBeInTheDocument();
  },
};

export const Polish: Story = {
  globals: { ...desktop, locale: "pl" },
  parameters: { apollo: { mocks: [fakeBackendMock(sample)] } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("React")).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "UTWÓRZ UMIEJĘTNOŚĆ" })).toBeInTheDocument();
  },
};

/** CREATE SKILL opens the empty modal; the Category field is enabled once the categories have loaded. */
export const CreateSkill: Story = {
  parameters: { apollo: { mocks: [fakeBackendMock(sample), skillCategoriesMock()] } },
  play: async ({ canvas }) => {
    await userEvent.click(await canvas.findByRole("button", { name: "CREATE SKILL" }));
    const dialog = await body.findByRole("dialog", { name: "Create skill" });

    await expect(within(dialog).getByRole("textbox", { name: "Name" })).toHaveValue("");
    await waitFor(() =>
      expect(within(dialog).getByRole("combobox", { name: "Category" })).toBeEnabled(),
    );
    await expect(within(dialog).getByRole("button", { name: "Create" })).toBeDisabled();
  },
};

/** Edit opens the modal filled with the name and category of the row; Update waits for a change. */
export const UpdateSkill: Story = {
  parameters: { apollo: { mocks: [fakeBackendMock(sample), skillCategoriesMock()] } },
  play: async ({ canvas }) => {
    await userEvent.click(await canvas.findByRole("button", { name: "Actions for PostgreSQL" }));
    await userEvent.click(await body.findByRole("menuitem", { name: "Edit" }));
    const dialog = await body.findByRole("dialog", { name: "Update skill" });

    await expect(within(dialog).getByRole("textbox", { name: "Name" })).toHaveValue("PostgreSQL");
    await waitFor(() =>
      expect(within(dialog).getByRole("combobox", { name: "Category" })).toHaveTextContent(
        "Databases",
      ),
    );
    await expect(within(dialog).getByRole("button", { name: "Update" })).toBeDisabled();
  },
};
