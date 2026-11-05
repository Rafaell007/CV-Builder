import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen } from "@/shared/testing";
import { SelectionToolbar } from "./SelectionToolbar";

function renderToolbar(count: number) {
  const onRemove = vi.fn();
  const onCancel = vi.fn();
  const result = renderWithProviders(
    <SelectionToolbar
      count={count}
      removeLabel="Remove"
      cancelLabel="Cancel"
      onRemove={onRemove}
      onCancel={onCancel}
    />,
  );
  return { ...result, onRemove, onCancel };
}

describe("SelectionToolbar", () => {
  it("shows the selected count on the Remove button", () => {
    renderToolbar(3);

    expect(screen.getByRole("button", { name: "Remove 3" })).toBeEnabled();
  });

  it("calls onRemove and onCancel", async () => {
    const { user, onRemove, onCancel } = renderToolbar(2);

    await user.click(screen.getByRole("button", { name: "Remove 2" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onRemove).toHaveBeenCalledOnce();
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("disables Remove and hides the count when nothing is selected", async () => {
    const { user, onRemove } = renderToolbar(0);
    const remove = screen.getByRole("button", { name: "Remove" });

    expect(remove).toBeDisabled();
    await user.click(remove);
    expect(onRemove).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeEnabled();
  });
});
