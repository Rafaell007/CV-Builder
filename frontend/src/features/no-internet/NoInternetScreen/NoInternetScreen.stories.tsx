import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";
import { NoInternetScreen } from "./NoInternetScreen";

const meta = {
  title: "Features/NoInternetScreen",
  component: NoInternetScreen,
  parameters: { layout: "fullscreen" },
  args: { onRetry: fn() },
} satisfies Meta<typeof NoInternetScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

// Figma 1440 › No internet.
export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByRole("alert")).toBeVisible();
    await expect(canvas.getByRole("heading", { level: 1, name: "Oops" })).toBeVisible();

    await userEvent.click(canvas.getByRole("button", { name: "Retry" }));
    await expect(args.onRetry).toHaveBeenCalledTimes(1);
  },
};
