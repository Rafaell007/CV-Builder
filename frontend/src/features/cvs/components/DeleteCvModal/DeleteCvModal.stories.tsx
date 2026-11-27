import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { Button } from "@/shared/components";
import { cvToDelete, deleteCvMock, deleteCvRefusedMock } from "../../useDeleteCv/deleteCv.mocks";
import { useDeleteCv } from "../../useDeleteCv";
import { DeleteCvModal } from "./DeleteCvModal";

const body = within(document.body);

const meta = {
  title: "Features/Cvs/DeleteCvModal",
  component: DeleteCvModal,
  args: { cv: cvToDelete, pending: false, onConfirm: fn(), onCancel: fn() },
} satisfies Meta<typeof DeleteCvModal>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The question with the CV name in bold, CANCEL and CONFIRM. Cancel has the focus, so Enter cannot delete by accident. */
export const Default: Story = {
  play: async ({ args }) => {
    const dialog = await body.findByRole("alertdialog", { name: "Delete CV" });
    await expect(dialog).toHaveTextContent(
      "Are you sure you want to delete CV Frontend Developer?",
    );
    await expect(within(dialog).getByText("Frontend Developer").tagName).toBe("STRONG");
    await expect(within(dialog).getByRole("button", { name: "Cancel" })).toHaveFocus();

    await userEvent.click(within(dialog).getByRole("button", { name: "Confirm" }));
    await expect(args.onConfirm).toHaveBeenCalledOnce();
  },
};

/** The request runs: CONFIRM shows its loading state and a click sends nothing more. */
export const Pending: Story = {
  args: { pending: true },
  play: async ({ args }) => {
    const dialog = await body.findByRole("alertdialog", { name: "Delete CV" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Confirm" }));
    await expect(args.onConfirm).not.toHaveBeenCalled();
  },
};

/** A name of 100 characters (the longest the form allows) must wrap inside the modal. */
export const LongName: Story = {
  args: {
    cv: { ...cvToDelete, name: "Senior Full Stack Developer ".repeat(4).trim().slice(0, 100) },
  },
  play: async () => {
    const dialog = await body.findByRole("alertdialog", { name: "Delete CV" });
    await expect(dialog.scrollWidth).toBeLessThanOrEqual(dialog.clientWidth);
  },
};

export const Polish: Story = {
  globals: { locale: "pl" },
  play: async () => {
    const dialog = await body.findByRole("alertdialog", { name: "Usuń CV" });
    await expect(within(dialog).getByRole("button", { name: "Anuluj" })).toBeInTheDocument();
  },
};

// The modal with the real hook, as the page will use it. The page is not built yet, so one fixed row stands in for it.
function DeleteFlowDemo() {
  const deletion = useDeleteCv({ page: 1, rowsOnPage: 1, onPageChange: fn() });
  return (
    <>
      <Button onClick={() => deletion.askToDelete(cvToDelete)}>Delete {cvToDelete.name}</Button>
      <DeleteCvModal
        cv={deletion.cv}
        pending={deletion.pending}
        onConfirm={() => void deletion.confirm()}
        onCancel={deletion.cancel}
      />
    </>
  );
}

const flowMeta = { render: () => <DeleteFlowDemo /> } satisfies Story;

/** CONFIRM sends `deleteCv` and the modal closes. */
export const DeleteFlow: Story = {
  ...flowMeta,
  parameters: { apollo: { mocks: [deleteCvMock(cvToDelete.id)] } },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Delete Frontend Developer" }));
    const dialog = await body.findByRole("alertdialog", { name: "Delete CV" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(body.queryByRole("alertdialog")).not.toBeInTheDocument());
  },
};

/** The CV is already gone (NOT_FOUND): the modal closes and the toast tells the user. */
export const DeleteFlowNotFound: Story = {
  ...flowMeta,
  parameters: { apollo: { mocks: [deleteCvRefusedMock(cvToDelete.id)] } },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Delete Frontend Developer" }));
    const dialog = await body.findByRole("alertdialog", { name: "Delete CV" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Confirm" }));
    await expect(
      await body.findByText("This CV does not exist any more. The list was updated."),
    ).toBeInTheDocument();
    await expect(body.queryByRole("alertdialog")).not.toBeInTheDocument();
  },
};
