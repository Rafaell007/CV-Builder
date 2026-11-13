import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/shared/testing";
import type { CvListItem } from "../../cvs.types";

import { DeleteCvModal } from "./DeleteCvModal";

const cv: CvListItem = {
  __typename: "Cv",
  id: "cv-1",
  name: "Frontend Developer",
  education: "MSc Computer Science",
  description: "Five years of React.",
  ownerEmail: "anna@example.com",
  userId: "user-1",
};

function setup(props: Partial<Parameters<typeof DeleteCvModal>[0]> = {}, locale?: "pl") {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  const view = renderWithProviders(
    <DeleteCvModal cv={cv} pending={false} onConfirm={onConfirm} onCancel={onCancel} {...props} />,
    locale === undefined ? {} : { locale },
  );
  return { ...view, onConfirm, onCancel };
}

describe("DeleteCvModal", () => {
  it("is closed without a CV", () => {
    setup({ cv: null });

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("asks to confirm the deletion with the CV name in bold", () => {
    setup();

    const dialog = screen.getByRole("alertdialog");
    expect(within(dialog).getByRole("heading", { name: "Delete CV" })).toBeInTheDocument();
    expect(dialog).toHaveTextContent("Are you sure you want to delete CV Frontend Developer?");
    expect(within(dialog).getByText("Frontend Developer").tagName).toBe("STRONG");
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

  it("closes when the CV is cleared", async () => {
    const { rerender } = setup();

    rerender(<DeleteCvModal cv={null} pending={false} onConfirm={vi.fn()} onCancel={vi.fn()} />);

    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  });

  it("shows the texts in Polish", () => {
    setup({}, "pl");

    expect(screen.getByRole("alertdialog")).toHaveTextContent(
      "Czy na pewno chcesz usunąć CV Frontend Developer?",
    );
  });
});
