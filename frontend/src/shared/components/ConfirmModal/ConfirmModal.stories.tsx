import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { Button } from "../Button";
import { ConfirmModal } from "./ConfirmModal";

// The Remove skills modal of docs/pages/12-user-skills-page.md with placeholder texts.
function RemoveSkillsDemo({ count }: { count: number }) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  async function confirm() {
    setIsPending(true);
    // The "server": answers after a short delay, so the loading state is visible.
    await new Promise((resolve) => setTimeout(resolve, 300));
    setIsPending(false);
    setOpen(false);
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Remove skills</Button>
      <ConfirmModal
        open={open}
        onOpenChange={setOpen}
        title="Remove skills"
        message={
          <>
            Are you sure you want to remove <strong>{count} skills</strong>?
          </>
        }
        closeLabel="Close"
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        onConfirm={confirm}
        isPending={isPending}
      />
    </>
  );
}

const meta = {
  title: "Shared/ConfirmModal",
  component: RemoveSkillsDemo,
  args: { count: 3 },
} satisfies Meta<typeof RemoveSkillsDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

const body = within(document.body);

export const Default: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Remove skills" }));
    const dialog = await body.findByRole("alertdialog", { name: "Remove skills" });
    // --color-modal-bg in light = #f5f5f7
    await expect(dialog).toHaveStyle({ backgroundColor: "rgb(245, 245, 247)" });
    await expect(within(dialog).getByRole("button", { name: "Cancel" })).toHaveFocus();
  },
};

export const Dark: Story = {
  globals: { theme: "dark" },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Remove skills" }));
    const dialog = await body.findByRole("alertdialog", { name: "Remove skills" });
    // --color-modal-bg in dark = #454545
    await expect(dialog).toHaveStyle({ backgroundColor: "rgb(69, 69, 69)" });
  },
};

export const ConfirmCloses: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Remove skills" }));
    const dialog = await body.findByRole("alertdialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Confirm" }));
    await expect(await canvas.findByRole("button", { name: "Remove skills" })).toHaveFocus();
    await expect(body.queryByRole("alertdialog")).not.toBeInTheDocument();
  },
};
