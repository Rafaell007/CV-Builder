import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { NotFoundScreen } from "./NotFoundScreen";

const meta = {
  title: "Features/NotFoundScreen",
  component: NotFoundScreen,
  parameters: { layout: "fullscreen" },
  args: {
    title: "Hmm...",
    messageLine1: "This doesn’t seem to be the page you were looking for.",
    messageLine2: "Let’s get you back on track.",
    goBackLabel: "Go back",
  },
} satisfies Meta<typeof NotFoundScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

// Figma 1440 › Not found.
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { level: 1, name: "Hmm..." })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Go back" })).toBeVisible();
  },
};
