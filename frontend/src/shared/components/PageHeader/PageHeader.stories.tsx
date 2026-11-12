import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { PersonOutlineIcon } from "../icons";
import { PageHeader } from "./PageHeader";

const meta = {
  title: "Shared/PageHeader",
  component: PageHeader,
  args: {
    title: "Employees",
    breadcrumbs: [{ label: "Employees" }],
    breadcrumbsLabel: "Breadcrumbs",
  },
} satisfies Meta<typeof PageHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { level: 1, name: "Employees" })).toBeInTheDocument();
  },
};

// Figma, USER PROFILE: Employees › User › Profile.
export const UserProfile: Story = {
  args: {
    title: "Profile",
    breadcrumbs: [
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
};
