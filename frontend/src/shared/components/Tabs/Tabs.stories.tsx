import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { Tabs } from "./Tabs";

const meta = {
  title: "Shared/Tabs",
  component: Tabs,
  args: {
    pathname: "/users/1",
    items: [
      { label: "Profile", href: "/users/1" },
      { label: "Skills", href: "/users/1/skills" },
      { label: "Languages", href: "/users/1/languages" },
      { label: "CVs", href: "/users/1/cvs" },
    ],
  },
} satisfies Meta<typeof Tabs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const FirstActive: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: "Profile" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  },
};

export const LaterTabActive: Story = {
  args: { pathname: "/users/1/languages" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: "Languages" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  },
};
