import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/shared/testing";
import { DeleteCatalogItemModal } from "./DeleteCatalogItemModal";

function renderModal(
  item: { id: string; name: string } | null,
  pending = false,
  error: string | null = null,
) {
  const handlers = { onConfirm: vi.fn(), onCancel: vi.fn() };
  const result = renderWithProviders(
    <DeleteCatalogItemModal
      namespace="catalogs.departments"
      item={item}
      pending={pending}
      error={error}
      {...handlers}
    />,
  );
  return { ...result, ...handlers };
}

describe("DeleteCatalogItemModal", () => {
  it("is closed without an item", () => {
    renderModal(null);

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("asks with the name of the item", async () => {
    renderModal({ id: "1", name: "Finance" });

    const dialog = await screen.findByRole("alertdialog");

    expect(within(dialog).getByRole("heading", { name: "Delete department" })).toBeInTheDocument();
    expect(dialog).toHaveTextContent("Are you sure you want to delete department Finance?");
  });

  it("calls onConfirm on Confirm and onCancel on Cancel", async () => {
    const { user, onConfirm, onCancel } = renderModal({ id: "1", name: "Finance" });
    const dialog = await screen.findByRole("alertdialog");

    await user.click(within(dialog).getByRole("button", { name: "Confirm" }));
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onCancel).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("calls onCancel on Escape", async () => {
    const { user, onCancel } = renderModal({ id: "1", name: "Finance" });
    await screen.findByRole("alertdialog");

    await user.keyboard("{Escape}");

    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("cannot send a second request while pending", async () => {
    const { user, onConfirm } = renderModal({ id: "1", name: "Finance" }, true);
    const dialog = await screen.findByRole("alertdialog");

    await user.click(within(dialog).getByRole("button", { name: "Confirm" }));

    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("shows the error inside the open modal and keeps Confirm and Cancel usable", async () => {
    const { user, onConfirm, onCancel } = renderModal(
      { id: "1", name: "Finance" },
      false,
      "Department cannot be deleted because it is currently in use",
    );
    const dialog = await screen.findByRole("alertdialog");

    expect(within(dialog).getByRole("alert")).toHaveTextContent(
      "Department cannot be deleted because it is currently in use",
    );
    await user.click(within(dialog).getByRole("button", { name: "Confirm" }));
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("shows no alert without an error", async () => {
    renderModal({ id: "1", name: "Finance" });
    await screen.findByRole("alertdialog");

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
