import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent } from "storybook/test";
import { Button } from "../Button";
import { ErrorScreen } from "./ErrorScreen";

// Only the content box: the full screen around it is drawn by the caller (see NoInternetState).
const meta = {
  title: "Shared/ErrorScreen",
  component: ErrorScreen,
} satisfies Meta<typeof ErrorScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

// Figma 768px Tablet › DEVICE ERROR: no action.
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

const onAction = fn();

// The action comes as children, for example a button.
export const WithAction: Story = {
  args: {
    title: "Oops",
    message: "Something went wrong.",
    announce: true,
    children: <Button onClick={onAction}>Retry</Button>,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("alert")).toHaveTextContent("Oops");

    await userEvent.click(canvas.getByRole("button", { name: "Retry" }));
    await expect(onAction).toHaveBeenCalledTimes(1);
  },
};
