import { fireEvent } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen } from "@/shared/testing";
import { Button } from "../Button";
import { ConfirmModal } from "./ConfirmModal";

// The caller, as the Remove skills flow wires it: close only after the request succeeds.
function RemoveSkills({ remove }: { remove: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  async function confirm() {
    if (isPending) return;
    setIsPending(true);
    try {
      await remove();
      setOpen(false);
    } catch {
      // The page shows an error toast; the modal stays open.
    } finally {
      setIsPending(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Remove</Button>
      <ConfirmModal
        open={open}
        onOpenChange={setOpen}
        title="Remove skills"
        message={
          <>
            Are you sure you want to remove <strong>3 skills</strong>?
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

async function renderOpen(remove = vi.fn<() => Promise<void>>()) {
  const rendered = renderWithProviders(<RemoveSkills remove={remove} />);
  await rendered.user.click(screen.getByRole("button", { name: "Remove" }));
  return { ...rendered, remove };
}

describe("ConfirmModal", () => {
  it("is an alert dialog named by its title, described by its message, with focus on CANCEL", async () => {
    await renderOpen();

    const dialog = screen.getByRole("alertdialog", { name: "Remove skills" });
    expect(dialog).toHaveAccessibleDescription("Are you sure you want to remove 3 skills?");
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
  });

  it("closes with CANCEL and Escape without sending, returning focus", async () => {
    const { user, remove } = await renderOpen();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove" })).toHaveFocus();

    await user.click(screen.getByRole("button", { name: "Remove" }));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(remove).not.toHaveBeenCalled();
  });

  it("closes only after the request succeeds", async () => {
    const { user, remove } = await renderOpen(vi.fn().mockResolvedValue(undefined));

    await user.click(screen.getByRole("button", { name: "Confirm" }));

    expect(remove).toHaveBeenCalledOnce();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("stays open after a failed request", async () => {
    const { user } = await renderOpen(vi.fn().mockRejectedValue(new Error("Network error")));

    await user.click(screen.getByRole("button", { name: "Confirm" }));

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm" })).not.toHaveAttribute("aria-busy");
  });

  it("shows loading and sends one request while the first is pending", async () => {
    const { user, remove } = await renderOpen(vi.fn(() => new Promise<void>(() => {})));

    await user.click(screen.getByRole("button", { name: "Confirm" }));
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    expect(screen.getByRole("button", { name: "Confirm" })).toHaveAttribute("aria-busy", "true");
    expect(remove).toHaveBeenCalledOnce();
  });

  it("does not close on a click outside", async () => {
    await renderOpen();

    // The page behind has pointer-events: none, so user-event cannot click it; Radix listens for pointerdown.
    fireEvent.pointerDown(document.body);

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });
});
