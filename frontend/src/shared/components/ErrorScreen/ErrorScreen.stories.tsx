import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent } from "storybook/test";
import { ErrorScreen } from "./ErrorScreen";

const meta = {
  title: "Shared/ErrorScreen",
  component: ErrorScreen,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ErrorScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

// Figma 1440 › NO INTERNET ERROR.
export const NoInternet: Story = {
  args: {
    title: "Oops",
    message: (
      <>
        Something went wrong. We’re already working on fixing it.
        <br />
        Please try again or go back.
      </>
    ),
    action: { label: "Retry", onClick: fn() },
    announce: true,
  },
  play: async ({ canvas, args }) => {
    await expect(canvas.getByRole("alert")).toHaveTextContent("Oops");

    await userEvent.click(canvas.getByRole("button", { name: "Retry" }));
    await expect(args.action?.onClick).toHaveBeenCalledTimes(1);
  },
};

// Figma 1440 › Not found.
export const NotFound: Story = {
  args: {
    title: "Hmm...",
    message: (
      <>
        This doesn’t seem to be the page you were looking for.
        <br />
        Let’s get you back on track.
      </>
    ),
    action: { label: "Go back", onClick: fn() },
  },
};

// Figma 768px Tablet › DEVICE ERROR: no button.
export const DeviceError: Story = {
  args: {
    title: "Oops",
    message: (
      <>
        This app isn’t supported on mobile devices.
        <br />
        Please open it on a desktop or tablet to continue.
      </>
    ),
  },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("button")).not.toBeInTheDocument();
  },
};
