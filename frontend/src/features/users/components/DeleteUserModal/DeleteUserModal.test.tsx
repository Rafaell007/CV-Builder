import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/shared/testing";
import { bravo, emailOnly } from "../../users.mocks";
import { DeleteUserModal } from "./DeleteUserModal";

function setup(props: Partial<Parameters<typeof DeleteUserModal>[0]> = {}, locale?: "pl") {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  const view = renderWithProviders(
    <DeleteUserModal
      user={bravo}
      pending={false}
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...props}
    />,
    locale === undefined ? {} : { locale },
  );
  return { ...view, onConfirm, onCancel };
}

describe("DeleteUserModal", () => {
  it("is closed without a user", () => {
    setup({ user: null });

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("asks to confirm the deletion with the full name in bold", () => {
    setup();

    const dialog = screen.getByRole("alertdialog");
    expect(within(dialog).getByRole("heading", { name: "Delete user" })).toBeInTheDocument();
    expect(dialog).toHaveTextContent("Are you sure you want to delete user Bravo Tango?");
    expect(within(dialog).getByText("Bravo Tango").tagName).toBe("STRONG");
  });

  it("shows the email for a user without a name", () => {
    setup({ user: emailOnly });

    expect(screen.getByRole("alertdialog")).toHaveTextContent(
      `Are you sure you want to delete user ${emailOnly.email}?`,
    );
  });

  it("calls onConfirm on Confirm and onCancel on Cancel", async () => {
    const { user, onConfirm, onCancel } = setup();
    const dialog = screen.getByRole("alertdialog");

    await user.click(within(dialog).getByRole("button", { name: "Confirm" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel on Escape", async () => {
    const { user, onCancel } = setup();

    await user.keyboard("{Escape}");

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("shows the loading state on Confirm while pending", () => {
    setup({ pending: true });

    expect(screen.getByRole("button", { name: "Confirm" })).toHaveAttribute("aria-busy", "true");
  });

  it("closes when the user is cleared", async () => {
    const { rerender } = setup();

    rerender(
      <DeleteUserModal user={null} pending={false} onConfirm={vi.fn()} onCancel={vi.fn()} />,
    );

    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  });

  it("shows the texts in Polish", () => {
    setup({}, "pl");

    expect(screen.getByRole("alertdialog")).toHaveTextContent(
      "Czy na pewno chcesz usunąć użytkownika Bravo Tango?",
    );
  });
});
