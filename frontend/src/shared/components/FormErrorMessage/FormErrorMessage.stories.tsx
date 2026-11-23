import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { FormErrorMessage } from "./FormErrorMessage";

const meta = {
  title: "Shared/FormErrorMessage",
  component: FormErrorMessage,
  args: {
    children: "Something went wrong. Please try again.",
  },
} satisfies Meta<typeof FormErrorMessage>;

export default meta;

type Story = StoryObj<typeof meta>;

// The general error under a form's fields, e.g. after a failed request in a Create or Update modal.
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("alert")).toHaveTextContent(
      "Something went wrong. Please try again.",
    );
  },
};
