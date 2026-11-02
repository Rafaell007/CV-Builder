import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { ThemeSample } from "./ThemeSample";

const meta = {
  title: "Setup/Theme sample",
  component: ThemeSample,
} satisfies Meta<typeof ThemeSample>;

export default meta;

type Story = StoryObj<typeof meta>;

// `globals.theme` picks the toolbar theme (addon-themes) for the story.
export const Light: Story = {
  globals: { theme: "light" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { name: "CV Builder" })).toBeVisible();
    await expect(document.documentElement).toHaveAttribute("data-theme", "light");
  },
};

export const Dark: Story = {
  globals: { theme: "dark" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { name: "CV Builder" })).toBeVisible();
    await expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  },
};
