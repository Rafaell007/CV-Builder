import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { ProfileMenu } from "./ProfileMenu";

const meta = {
  title: "Features/AppShell/ProfileMenu",
  component: ProfileMenu,
  args: {
    name: "Jan Kowalski",
    profileHref: "/users/1/profile",
    settingsHref: "/settings",
    labels: { profile: "Profile", settings: "Settings", logout: "Logout" },
    onLogout: fn(),
  },
  // The menu opens above the row, as at the bottom of the sidebar.
  decorators: [
    (Story) => (
      <div style={{ width: 200, paddingTop: 140 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ProfileMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Closed: Story = {};

export const Open: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: /Jan Kowalski/ }));

    // The menu is rendered in a portal, outside the story's canvas.
    const menu = within(document.body);
    await expect(menu.getByRole("menuitem", { name: "Profile" })).toBeInTheDocument();
    await expect(menu.getByRole("menuitem", { name: "Settings" })).toBeInTheDocument();

    await userEvent.click(menu.getByRole("menuitem", { name: "Logout" }));
    await expect(args.onLogout).toHaveBeenCalledTimes(1);
  },
};
