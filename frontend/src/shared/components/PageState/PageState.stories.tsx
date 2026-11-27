import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent } from "storybook/test";
import { PageState } from "./PageState";

const meta = {
  title: "Shared/PageState",
  component: PageState,
  args: { kind: "loading", onRetry: fn() },
} satisfies Meta<typeof PageState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Loading: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("status", { name: "Loading" })).toBeInTheDocument();
  },
};

export const Empty: Story = {
  args: { kind: "empty", labels: { empty: "No users found" } },
};

export const NoResults: Story = {
  args: { kind: "no-results", labels: { noResults: "No CVs found" } },
};

export const ErrorWithRetry: Story = {
  args: { kind: "error", labels: { error: "Failed to load CVs" } },
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Retry" }));
    await expect(args.onRetry).toHaveBeenCalled();
  },
};
