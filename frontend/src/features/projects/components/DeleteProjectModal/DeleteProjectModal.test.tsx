import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/shared/testing";
import { blog } from "../../projects.mocks";
import { DeleteProjectModal } from "./DeleteProjectModal";

function setup(props: Partial<Parameters<typeof DeleteProjectModal>[0]> = {}, locale?: "pl") {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  const view = renderWithProviders(
    <DeleteProjectModal
      project={blog}
      pending={false}
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...props}
    />,
    locale === undefined ? {} : { locale },
  );
  return { ...view, onConfirm, onCancel };
}

describe("DeleteProjectModal", () => {
  it("is closed without a project", () => {
    setup({ project: null });

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("asks to confirm the deletion with the project name in bold", () => {
    setup();

    const dialog = screen.getByRole("alertdialog");
    expect(within(dialog).getByRole("heading", { name: "Delete project" })).toBeInTheDocument();
    expect(dialog).toHaveTextContent("Are you sure you want to delete project Blog?");
    expect(within(dialog).getByText("Blog").tagName).toBe("STRONG");
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

  it("closes when the project is cleared", async () => {
    const { rerender } = setup();

    rerender(
      <DeleteProjectModal project={null} pending={false} onConfirm={vi.fn()} onCancel={vi.fn()} />,
    );

    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  });

  it("shows the texts in Polish", () => {
    setup({}, "pl");

    expect(screen.getByRole("alertdialog")).toHaveTextContent(
      "Czy na pewno chcesz usunąć projekt Blog?",
    );
  });
});
