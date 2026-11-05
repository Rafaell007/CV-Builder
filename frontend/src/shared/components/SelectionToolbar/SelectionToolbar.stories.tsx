import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";
import { SelectionToolbar } from "./SelectionToolbar";

// The selection mode bar of docs/pages/12-user-skills-page.md with placeholder texts.
const meta = {
  title: "Shared/SelectionToolbar",
  component: SelectionToolbar,
  args: {
    count: 3,
    removeLabel: "Remove",
    cancelLabel: "Cancel",
    onRemove: fn(),
    onCancel: fn(),
  },
} satisfies Meta<typeof SelectionToolbar>;

export default meta;

type Story = StoryObj<typeof meta>;

// Badge: --color-text-on-primary #f5f5f7 fill, --color-primary #c63031 number (same in both themes)
const badgeColours = { backgroundColor: "rgb(245, 245, 247)", color: "rgb(198, 48, 49)" };

export const Default: Story = {
  play: async ({ canvas }) => {
    const badge = canvas.getByText("3");
    await expect(badge).toHaveStyle(badgeColours);
    await expect(canvas.getByRole("button", { name: "Remove 3" })).toBeEnabled();
  },
};

export const NoneSelected: Story = {
  args: { count: 0 },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Remove" })).toBeDisabled();
  },
};

export const Dark: Story = {
  globals: { theme: "dark" },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("3")).toHaveStyle(badgeColours);
  },
};
