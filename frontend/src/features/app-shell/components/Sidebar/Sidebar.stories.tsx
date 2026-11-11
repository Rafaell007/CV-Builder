import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { CSSProperties } from "react";
import { expect, fn } from "storybook/test";
import type { NavLabelKey } from "../../navigation.types";
import { getNavItems, toSidebarLinks } from "../../utils";
import { ProfileMenu } from "../ProfileMenu";
import { Sidebar } from "./Sidebar";

// English labels, so the stories do not depend on next-intl.
const LABELS: Record<NavLabelKey, string> = {
  employees: "Employees",
  skills: "Skills",
  languages: "Languages",
  cvs: "CVs",
  departments: "Departments",
  positions: "Positions",
  projects: "Projects",
};

const translate = (key: NavLabelKey) => LABELS[key];

function linksFor(role: "USER" | "ADMIN", pathname: string) {
  const { mainItems, extraItems } = getNavItems(role);
  return {
    mainLinks: toSidebarLinks(mainItems, pathname, translate),
    extraLinks: toSidebarLinks(extraItems, pathname, translate),
  };
}

// In the app, AppShell sets these variables (AppShell.module.css); here the story does.
const EXPANDED = { "--sidebar-width": "200px", "--chevron-flip": 1 } as CSSProperties;
const COLLAPSED = { "--sidebar-width": "56px", "--chevron-flip": -1 } as CSSProperties;

const meta = {
  title: "Features/AppShell/Sidebar",
  component: Sidebar,
  parameters: { layout: "fullscreen" },
  args: {
    appName: "CV Builder",
    navigationLabel: "Main navigation",
    toggleLabel: "Sidebar",
    collapsed: false,
    onToggle: fn(),
    ...linksFor("USER", "/users"),
    footer: (
      <ProfileMenu
        name="Jan Kowalski"
        profileHref="/users/1/profile"
        settingsHref="/settings"
        labels={{ profile: "Profile", settings: "Settings", logout: "Logout" }}
        onLogout={fn()}
      />
    ),
  },
  decorators: [
    (Story, { args }) => (
      <div style={args.collapsed ? COLLAPSED : EXPANDED}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Sidebar>;

export default meta;

type Story = StoryObj<typeof meta>;

// Figma 1440 › USERS: 4 links, Employees active.
export const User: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole("link")).toHaveLength(4);
    await expect(canvas.getByRole("link", { name: "Employees" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  },
};

// Figma 1440 › USERS (admin): 4 links, a divider, 3 admin links.
export const Admin: Story = {
  args: linksFor("ADMIN", "/admin/departments"),
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole("link")).toHaveLength(7);
    await expect(canvas.getByRole("link", { name: "Departments" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  },
};

// Figma 768px Tablet: icons only; the labels stay the links' accessible names.
export const Collapsed: Story = {
  args: { collapsed: true, ...linksFor("ADMIN", "/users") },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Sidebar" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await expect(canvas.getByRole("link", { name: "Employees" })).toBeInTheDocument();
  },
};
