import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { PersonOutlineIcon } from "../icons";
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

// Employees › User › Profile: the user is red with a person icon (Figma, USER PROFILE).
export const HighlightedItem: Story = {
  args: {
    items: [
      { label: "Employees", href: "/users" },
      {
        label: "Jan Kowalski",
        href: "/users/1/profile",
        highlighted: true,
        icon: <PersonOutlineIcon />,
      },
      { label: "Profile" },
    ],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: "Jan Kowalski" })).toBeInTheDocument();
  },
};

export const SingleItem: Story = {
  args: { items: [{ label: "Users" }] },
};
