import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";
import { MoreVertIcon } from "../icons";
import { IconButton } from "./IconButton";

const meta = {
  title: "Form controls/IconButton",
  component: IconButton,
  args: { "aria-label": "Open menu", children: <MoreVertIcon />, onClick: fn() },
} satisfies Meta<typeof IconButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    // --color-icon in light = #626262
    await expect(canvas.getByRole("button", { name: "Open menu" })).toHaveStyle({
      color: "rgb(98, 98, 98)",
    });
  },
};

export const Dark: Story = {
  globals: { theme: "dark" },
  play: async ({ canvas }) => {
    // --color-icon in dark = #f5f5f7
    await expect(canvas.getByRole("button", { name: "Open menu" })).toHaveStyle({
      color: "rgb(245, 245, 247)",
    });
  },
};

export const Disabled: Story = { args: { disabled: true } };
