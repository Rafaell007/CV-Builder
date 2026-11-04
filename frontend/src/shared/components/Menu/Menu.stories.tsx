import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { Menu } from "./Menu";

const meta = {
  title: "Shared/Menu",
  component: Menu,
  args: {
    items: [
      { label: "View", onSelect: fn() },
      { label: "Update", onSelect: fn() },
      { label: "Delete", onSelect: fn(), destructive: true },
    ],
  },
} satisfies Meta<typeof Menu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Closed: Story = {};

export const OpensAndSelects: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Actions" }));
    // The menu renders in a portal, outside the canvas element.
    const menu = within(document.body);
    await userEvent.click(await menu.findByRole("menuitem", { name: "Update" }));
    await expect(args.items[1]?.onSelect).toHaveBeenCalled();
    await expect(menu.queryByRole("menu")).not.toBeInTheDocument();
  },
};

export const ClosesOnEscape: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Actions" }));
    const menu = within(document.body);
    await expect(await menu.findByRole("menu")).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await expect(menu.queryByRole("menu")).not.toBeInTheDocument();
  },
};

export const WithDisabledItem: Story = {
  args: {
    items: [
      { label: "View", onSelect: fn() },
      { label: "Delete", onSelect: fn(), destructive: true, disabled: true },
    ],
  },
};
