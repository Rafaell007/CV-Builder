import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { Breadcrumbs } from "./Breadcrumbs";

const meta = {
  title: "Shared/Breadcrumbs",
  component: Breadcrumbs,
  args: {
    items: [
      { label: "Users", href: "/users" },
      { label: "Jan Kowalski", href: "/users/1" },
      { label: "Skills" },
    ],
  },
} satisfies Meta<typeof Breadcrumbs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: "Users" })).toBeInTheDocument();
    await expect(canvas.getByText("Skills")).toHaveAttribute("aria-current", "page");
  },
};

export const SingleItem: Story = {
  args: { items: [{ label: "Users" }] },
};
