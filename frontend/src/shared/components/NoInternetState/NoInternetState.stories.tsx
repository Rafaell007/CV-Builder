import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent } from "storybook/test";
import { NoInternetState } from "./NoInternetState";

const meta = {
  title: "Shared/NoInternetState",
  component: NoInternetState,
  parameters: { layout: "fullscreen" },
  args: {
    title: "Oops",
    message: (
      <>
        Something went wrong. We’re already working on fixing it.
        <br />
        Please try again or go back.
      </>
    ),
    retryLabel: "Retry",
    onRetry: fn(),
  },
} satisfies Meta<typeof NoInternetState>;

export default meta;

type Story = StoryObj<typeof meta>;

// Figma 1440 › NO INTERNET ERROR.
export const Default: Story = {
  play: async ({ canvas, args }) => {
    await expect(canvas.getByRole("alert")).toHaveTextContent("Oops");

    await userEvent.click(canvas.getByRole("button", { name: "Retry" }));
    await expect(args.onRetry).toHaveBeenCalledTimes(1);
  },
};
