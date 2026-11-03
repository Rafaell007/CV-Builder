import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { Avatar } from "./Avatar";

const meta = {
  title: "Shared/Avatar",
  component: Avatar,
  args: { name: "Jan Kowalski" },
} satisfies Meta<typeof Avatar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Initials: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("JK")).toBeInTheDocument();
  },
};

export const Image: Story = {
  args: { src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E" },
};

export const BrokenImage: Story = {
  args: { src: "/does-not-exist.png" },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("JK")).toBeInTheDocument();
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
      <Avatar {...args} size="small" />
      <Avatar {...args} size="medium" />
      <Avatar {...args} size="large" />
    </div>
  ),
};
