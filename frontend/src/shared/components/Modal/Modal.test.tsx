import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen } from "@/shared/testing";
import { Button } from "../Button";
import { DatePicker } from "../DatePicker";
import { DATE_PICKER_EXAMPLE_LABELS } from "../DatePicker/datePicker.fixtures";
import { Modal, type ModalProps } from "./Modal";

// Opened by a page button, as on the real pages (no Radix Trigger).
function ModalWithOpener(props: Partial<ModalProps>) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Add skill</Button>
      <Modal
        title="Add skill"
        closeLabel="Close"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button>Add</Button>
          </>
        }
        {...props}
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          props.onOpenChange?.(next);
        }}
      />
    </>
  );
}

async function renderOpen(props: Partial<ModalProps> = {}) {
  const rendered = renderWithProviders(<ModalWithOpener {...props} />);
  await rendered.user.click(screen.getByRole("button", { name: "Add skill" }));
  return rendered;
}

describe("Modal", () => {
  it("renders nothing while closed", () => {
    renderWithProviders(<ModalWithOpener />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("is a dialog named by its title, without a description by default", async () => {
    await renderOpen();

    const dialog = screen.getByRole("dialog", { name: "Add skill" });
    expect(dialog).not.toHaveAttribute("aria-describedby");
  });

  it.each([false, null])(
    "has no description when it is %s (conditional JSX)",
    async (description) => {
      await renderOpen({ description });

      expect(screen.getByRole("dialog")).not.toHaveAttribute("aria-describedby");
    },
  );

  it("is described by its description", async () => {
    await renderOpen({ description: "Pick a skill and its level." });

    expect(screen.getByRole("dialog")).toHaveAccessibleDescription("Pick a skill and its level.");
  });

  it("keeps Tab inside the dialog", async () => {
    const { user } = await renderOpen();
    const close = screen.getByRole("button", { name: "Close" });
    const add = screen.getByRole("button", { name: "Add" });
    expect(close).toHaveFocus();

    await user.tab();
    await user.tab();
    expect(add).toHaveFocus();

    await user.tab();
    expect(close).toHaveFocus();

    await user.tab({ shift: true });
    expect(add).toHaveFocus();
  });

  it("closes on Escape and returns focus to the button that opened it", async () => {
    const onOpenChange = vi.fn();
    const { user } = await renderOpen({ onOpenChange });

    await user.keyboard("{Escape}");

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add skill" })).toHaveFocus();
  });

  it("closes with the close button", async () => {
    const onOpenChange = vi.fn();
    const { user } = await renderOpen({ onOpenChange });

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  describe("with a DatePicker inside", () => {
    function ModalWithDate({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
      return (
        <Modal open onOpenChange={onOpenChange} title="Add project" closeLabel="Close">
          <DatePicker
            label="Start Date"
            locale="en"
            labels={DATE_PICKER_EXAMPLE_LABELS}
            value={null}
            onValueChange={() => undefined}
          />
        </Modal>
      );
    }

    it("closes only the calendar on the first Escape and the modal on the second", async () => {
      const onOpenChange = vi.fn();
      const { user } = renderWithProviders(<ModalWithDate onOpenChange={onOpenChange} />);
      const input = screen.getByRole("textbox", { name: "Start Date" });
      await user.click(input);
      expect(
        screen.getByRole("dialog", { name: DATE_PICKER_EXAMPLE_LABELS.calendar }),
      ).toBeInTheDocument();

      await user.keyboard("{Escape}");

      expect(
        screen.queryByRole("dialog", { name: DATE_PICKER_EXAMPLE_LABELS.calendar }),
      ).not.toBeInTheDocument();
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(screen.getByRole("dialog", { name: "Add project" })).toBeInTheDocument();
      expect(input).toHaveFocus();

      await user.keyboard("{Escape}");

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
