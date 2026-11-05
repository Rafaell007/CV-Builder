import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { Button } from "../Button";
import { Modal, type ModalProps } from "./Modal";

type ModalStoryArgs = Pick<ModalProps, "title" | "description" | "closeLabel">;

// Opened by a page button, as on the real pages.
function ModalDemo(args: ModalStoryArgs) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open modal</Button>
      <Modal
        {...args}
        open={open}
        onOpenChange={setOpen}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setOpen(false)}>Add</Button>
          </>
        }
      />
    </>
  );
}

const meta = {
  title: "Shared/Modal",
  component: ModalDemo,
  args: { title: "Add skill", closeLabel: "Close" },
} satisfies Meta<typeof ModalDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

const openModal = async (canvas: ReturnType<typeof within>) => {
  await userEvent.click(canvas.getByRole("button", { name: "Open modal" }));
  // The modal renders in a portal, outside the canvas element.
  return within(document.body).findByRole("dialog", { name: "Add skill" });
};

export const Default: Story = {
  play: async ({ canvas }) => {
    const dialog = await openModal(canvas);
    // --color-modal-bg in light = #f5f5f7
    await expect(dialog).toHaveStyle({ backgroundColor: "rgb(245, 245, 247)", width: "620px" });
    // Spacing from docs/design-tokens.md: 26 under the title, 26 above the buttons.
    const header = within(dialog).getByRole("heading", { name: "Add skill" }).parentElement;
    const footer = within(dialog).getByRole("button", { name: "Cancel" }).parentElement;
    await expect(header).toHaveStyle({ marginBottom: "26px" });
    await expect(footer).toHaveStyle({ marginTop: "26px" });
  },
};

export const Dark: Story = {
  globals: { theme: "dark" },
  play: async ({ canvas }) => {
    const dialog = await openModal(canvas);
    // --color-modal-bg in dark = #454545
    await expect(dialog).toHaveStyle({ backgroundColor: "rgb(69, 69, 69)" });
  },
};

export const WithDescription: Story = {
  args: { description: "Pick a skill and its level." },
  play: async ({ canvas }) => {
    const dialog = await openModal(canvas);
    await expect(dialog).toHaveAccessibleDescription("Pick a skill and its level.");
  },
};

export const ClosesOnEscape: Story = {
  play: async ({ canvas }) => {
    await openModal(canvas);
    await userEvent.keyboard("{Escape}");
    await expect(within(document.body).queryByRole("dialog")).not.toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Open modal" })).toHaveFocus();
  },
};
