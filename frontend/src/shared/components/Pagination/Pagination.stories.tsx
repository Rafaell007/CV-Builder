import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, fn, userEvent } from "storybook/test";
import { Pagination, type PaginationProps } from "./Pagination";

const meta = {
  title: "Shared/Pagination",
  component: Pagination,
  args: { page: 1, total: 95, onPageChange: fn() },
} satisfies Meta<typeof Pagination>;

export default meta;

type Story = StoryObj<typeof meta>;

// Keeps the page in state, as a list page does with its query.
function PaginationWithState(args: PaginationProps) {
  const [page, setPage] = useState(args.page);
  return (
    <Pagination
      {...args}
      page={page}
      onPageChange={(next) => {
        setPage(next);
        args.onPageChange(next);
      }}
    />
  );
}

export const ManyPages: Story = {
  render: (args) => <PaginationWithState {...args} />,
  play: async ({ canvas, args }) => {
    await expect(canvas.getByRole("button", { name: "Page 1" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Next page" }));
    await expect(args.onPageChange).toHaveBeenCalledWith(2);
    await expect(canvas.getByRole("button", { name: "Page 2" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  },
};

export const FewPages: Story = {
  args: { total: 25 },
  render: (args) => <PaginationWithState {...args} />,
};

export const LastPage: Story = {
  args: { page: 10 },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Next page" })).toBeDisabled();
  },
};

export const OnePage: Story = {
  args: { total: 8 },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("navigation")).not.toBeInTheDocument();
  },
};
