import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen } from "@/shared/testing";
import { Menu } from "./Menu";

function renderMenus(onDelete = vi.fn()) {
  return renderWithProviders(
    <>
      <Menu
        label="Actions for Jan"
        items={[
          { label: "View", onSelect: vi.fn() },
          { label: "Delete", onSelect: onDelete, destructive: true },
        ]}
      />
      <Menu label="Actions for Anna" items={[{ label: "View", onSelect: vi.fn() }]} />
    </>,
  );
}

describe("Menu", () => {
  it("is closed until the button is clicked", async () => {
    const { user } = renderMenus();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Actions for Jan" }));

    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Delete" })).toBeInTheDocument();
  });

  it("calls onSelect and closes after an item is selected", async () => {
    const onDelete = vi.fn();
    const { user } = renderMenus(onDelete);
    await user.click(screen.getByRole("button", { name: "Actions for Jan" }));

    await user.click(screen.getByRole("menuitem", { name: "Delete" }));

    expect(onDelete).toHaveBeenCalledOnce();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes on Escape", async () => {
    const { user } = renderMenus();
    await user.click(screen.getByRole("button", { name: "Actions for Jan" }));

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes on a click outside", async () => {
    const { user } = renderMenus();
    await user.click(screen.getByRole("button", { name: "Actions for Jan" }));

    // Radix blocks pointer events on the page while the menu is open and listens for pointerdown.
    fireEvent.pointerDown(document.body);

    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
  });

  it("keeps only one menu open at a time", async () => {
    const { user } = renderMenus();
    await user.click(screen.getByRole("button", { name: "Actions for Jan" }));

    // The open menu hides the rest of the page, so the second button is found with hidden: true.
    fireEvent.pointerDown(screen.getByRole("button", { name: "Actions for Anna", hidden: true }));

    await waitFor(() =>
      expect(screen.queryByRole("menuitem", { name: "Delete" })).not.toBeInTheDocument(),
    );
    expect(screen.getAllByRole("menu")).toHaveLength(1);
    expect(screen.getByRole("menuitem", { name: "View" })).toBeInTheDocument();
  });

  it("does not call onSelect of a disabled item", async () => {
    const onSelect = vi.fn();
    const { user } = renderWithProviders(
      <Menu items={[{ label: "Update", onSelect, disabled: true }]} />,
    );
    await user.click(screen.getByRole("button", { name: "Actions" }));

    await user.click(screen.getByRole("menuitem", { name: "Update" }));

    expect(onSelect).not.toHaveBeenCalled();
  });
});
