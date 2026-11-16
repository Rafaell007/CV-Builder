import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { cvPreviewSample } from "../../../useCvPreview";
import { CvPreviewSkillsTable } from "./CvPreviewSkillsTable";

const tablet = { viewport: { value: "tablet", isRotated: false } };

const meta = {
  title: "Features/CVs/CvPreview/CvPreviewSkillsTable",
  component: CvPreviewSkillsTable,
  args: { skillGroups: cvPreviewSample.skillGroups },
} satisfies Meta<typeof CvPreviewSkillsTable>;

export default meta;

type Story = StoryObj<typeof meta>;

// Two categories; the Frontend cell spans two skill rows.
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("table", { name: "Professional skills" })).toBeVisible();
    await expect(canvas.getByRole("rowheader", { name: "Frontend" })).toHaveAttribute(
      "rowspan",
      "2",
    );
    await expect(canvas.getByRole("cell", { name: "React" })).toBeVisible();
  },
};

// GraphQL has no years and no last used year: the cells show an en dash.
export const MissingValues: Story = {
  play: async ({ canvas }) => {
    const row = canvas.getByRole("cell", { name: "GraphQL" }).closest("tr") as HTMLElement;
    await expect(within(row).getAllByText("–")).toHaveLength(2);
  },
};

export const NoSkills: Story = {
  args: { skillGroups: [] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("No skills added")).toBeVisible();
  },
};

// The table scrolls sideways inside its own box at tablet width. Check the layout in the Storybook UI.
export const Tablet: Story = {
  globals: tablet,
};

export const Dark: Story = {
  globals: { theme: "dark" },
};

export const Polish: Story = {
  globals: { locale: "pl" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("table", { name: "Umiejętności zawodowe" })).toBeVisible();
  },
};
