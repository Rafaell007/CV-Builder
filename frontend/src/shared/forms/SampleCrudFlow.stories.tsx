import { CombinedGraphQLErrors } from "@apollo/client";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, fn, waitFor, within } from "storybook/test";
import { z } from "zod";
import {
  Button,
  ConfirmModal,
  FormModal,
  SelectionToolbar,
  TextField,
  useToast,
} from "@/shared/components";
import { applyServerFieldErrors } from "./applyServerFieldErrors";
import { useZodForm } from "./useZodForm";

// The KAN-81 demo: one CRUD page's create and delete flows with every overlay (docs/pages/12-user-skills-page.md):
// FormModal + server field errors + success toast; selection mode + ConfirmModal + error toast that keeps
// the selection. Texts are placeholders; a real page translates them and calls Apollo mutations.

type Skill = { id: string; name: string };

const INITIAL_SKILLS: Skill[] = [
  { id: "1", name: "React" },
  { id: "2", name: "NestJS" },
  { id: "3", name: "PostgreSQL" },
];

const schema = z.object({ name: z.string().trim().min(1, "Enter a skill name") });
type Values = z.input<typeof schema>;

const TAKEN_MESSAGE = "This skill already exists";

// Rejects like Apollo does when the backend answers BAD_USER_INPUT for `name`.
const nameTaken = new CombinedGraphQLErrors({
  errors: [
    {
      message: "Bad Request Exception",
      extensions: {
        code: "BAD_USER_INPUT",
        fieldErrors: [{ field: "name", messages: ["name already exists"] }],
      },
    },
  ],
});

type SampleCrudFlowProps = {
  // The "server" calls; a real page sends GraphQL mutations.
  create: (name: string) => Promise<void>;
  remove: (ids: readonly string[]) => Promise<void>;
};

// Page logic, as a feature's own hook would hold it.
function useSampleCrudFlow({ create, remove }: SampleCrudFlowProps) {
  const toast = useToast();
  const [skills, setSkills] = useState(INITIAL_SKILLS);
  const form = useZodForm(schema, { defaultValues: { name: "" } satisfies Values });
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<readonly string[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  function openAdd() {
    form.reset({ name: "" });
    setIsAddOpen(true);
  }

  const submitAdd = form.handleSubmit(async ({ name }) => {
    try {
      await create(name);
      setSkills((current) => [...current, { id: crypto.randomUUID(), name }]);
      setIsAddOpen(false);
      toast.success({ title: "Skill added", description: `${name} was added.` });
    } catch (error) {
      const allShown = applyServerFieldErrors(error, form.setError, {
        fields: ["name"],
        getMessage: () => TAKEN_MESSAGE,
      });
      if (!allShown) toast.error({ title: "Something went wrong", description: "Try again." });
    }
  });

  function toggle(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((selected) => selected !== id) : [...current, id],
    );
  }

  function cancelSelection() {
    setIsSelecting(false);
    setSelectedIds([]);
  }

  async function confirmRemove() {
    if (isRemoving) return;
    setIsRemoving(true);
    try {
      await remove(selectedIds);
      setSkills((current) => current.filter((skill) => !selectedIds.includes(skill.id)));
      setIsConfirmOpen(false);
      toast.success({
        title: "Skills removed",
        description: `${selectedIds.length} skills were removed.`,
      });
      cancelSelection();
    } catch {
      // The modal closes and the selection stays, so the user can press REMOVE again. Closing matters: while a
      // modal is open Radix hides the rest of the page, so a keyboard user could not reach the error toast
      // (it stays until closed).
      setIsConfirmOpen(false);
      toast.error({ title: "Could not remove skills", description: "Try again." });
    } finally {
      setIsRemoving(false);
    }
  }

  return {
    skills,
    form,
    add: { isOpen: isAddOpen, open: openAdd, setOpen: setIsAddOpen, submit: submitAdd },
    selection: {
      isSelecting,
      start: () => setIsSelecting(true),
      cancel: cancelSelection,
      selectedIds,
      toggle,
    },
    confirm: {
      isOpen: isConfirmOpen,
      setOpen: setIsConfirmOpen,
      submit: confirmRemove,
      isPending: isRemoving,
    },
  };
}

function SampleCrudFlow(props: SampleCrudFlowProps) {
  const { skills, form, add, selection, confirm } = useSampleCrudFlow(props);
  const { errors, isValid, isDirty, isSubmitting } = form.formState;

  return (
    <div style={{ display: "grid", gap: "var(--space-6)", maxWidth: 600 }}>
      <div style={{ display: "flex", gap: "var(--space-6)" }}>
        <Button onClick={add.open}>Add skill</Button>
        <Button variant="secondary" onClick={selection.start} disabled={selection.isSelecting}>
          Remove skills
        </Button>
      </div>

      <ul aria-label="Skills" style={{ margin: 0, padding: 0, listStyle: "none" }}>
        {skills.map((skill) => (
          <li key={skill.id}>
            {selection.isSelecting ? (
              <label>
                <input
                  type="checkbox"
                  checked={selection.selectedIds.includes(skill.id)}
                  onChange={() => selection.toggle(skill.id)}
                />{" "}
                {skill.name}
              </label>
            ) : (
              skill.name
            )}
          </li>
        ))}
      </ul>

      {selection.isSelecting && (
        <SelectionToolbar
          count={selection.selectedIds.length}
          removeLabel="Remove"
          cancelLabel="Cancel"
          onRemove={() => confirm.setOpen(true)}
          onCancel={selection.cancel}
        />
      )}

      <FormModal
        open={add.isOpen}
        onOpenChange={add.setOpen}
        title="Add skill"
        closeLabel="Close"
        submitLabel="Confirm"
        cancelLabel="Cancel"
        canSubmit={isValid && isDirty}
        isSubmitting={isSubmitting}
        onSubmit={add.submit}
      >
        <TextField {...form.register("name")} label="Skill name" error={errors.name?.message} />
      </FormModal>

      <ConfirmModal
        open={confirm.isOpen}
        onOpenChange={confirm.setOpen}
        title="Remove skills"
        message={
          <>
            Are you sure you want to remove <strong>{selection.selectedIds.length} skills</strong>?
          </>
        }
        closeLabel="Close"
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        onConfirm={() => void confirm.submit()}
        isPending={confirm.isPending}
      />
    </div>
  );
}

const meta = {
  title: "Forms/Sample CRUD flow",
  component: SampleCrudFlow,
  args: { create: fn(async () => undefined), remove: fn(async () => undefined) },
} satisfies Meta<typeof SampleCrudFlow>;

export default meta;

type Story = StoryObj<typeof meta>;

const body = within(document.body);
// `hidden: true`: while a modal is open Radix sets aria-hidden on the rest of the page, toasts included;
// screen readers still hear them through Radix's separate live region (checked in DeleteFails).
const toasts = () => within(body.getByRole("region", { name: "Notifications (F8)", hidden: true }));

// Create: the server rejects the first name (error under the field, modal stays open, value kept);
// a new name succeeds: the modal closes, a success toast shows and the list has the skill.
export const Create: Story = {
  args: {
    create: fn(async (name: string) => {
      if (name === "React") throw nameTaken;
    }),
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Add skill" }));
    const dialog = await body.findByRole("dialog", { name: "Add skill" });
    const field = within(dialog).getByRole("textbox", { name: "Skill name" });

    await userEvent.type(field, "React");
    await userEvent.click(within(dialog).getByRole("button", { name: "Confirm" }));
    await expect(await within(dialog).findByText(TAKEN_MESSAGE)).toBeInTheDocument();
    await expect(field).toHaveValue("React");
    await expect(field).toHaveFocus();

    await userEvent.clear(field);
    await userEvent.type(field, "Vue");
    await userEvent.click(within(dialog).getByRole("button", { name: "Confirm" }));

    await expect(await toasts().findByText("Skill added")).toBeInTheDocument();
    await waitFor(() => expect(body.queryByRole("dialog")).not.toBeInTheDocument());
    await expect(
      within(canvas.getByRole("list", { name: "Skills" })).getByText("Vue"),
    ).toBeInTheDocument();
    await expect(args.create).toHaveBeenCalledTimes(2);
  },
};

// Delete fails: the ConfirmModal closes, the error toast is announced at once and a keyboard user reaches it
// with F8 and closes it; the selection stays and focus is back on REMOVE.
export const DeleteFails: Story = {
  args: {
    remove: fn(async () => {
      throw new Error("Network error");
    }),
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Remove skills" }));
    await expect(canvas.getByRole("button", { name: "Remove" })).toBeDisabled();
    await userEvent.click(canvas.getByRole("checkbox", { name: "React" }));
    await userEvent.click(canvas.getByRole("checkbox", { name: "NestJS" }));
    await userEvent.click(canvas.getByRole("button", { name: "Remove 2" }));

    const dialog = await body.findByRole("alertdialog", { name: "Remove skills" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Confirm" }));

    const title = await toasts().findByText("Could not remove skills");
    await expect(args.remove).toHaveBeenCalledWith(["1", "2"]);
    await waitFor(() => expect(body.queryByRole("alertdialog")).not.toBeInTheDocument());
    const announcement = await body.findByText(/Notification\s+Could not remove skills/);
    await expect(announcement.closest("[aria-live]")).toHaveAttribute("aria-live", "assertive");

    // The selection stays and focus returns to the button that opened the modal.
    await expect(canvas.getByRole("checkbox", { name: "React" })).toBeChecked();
    await expect(canvas.getByRole("button", { name: "Remove 2" })).toHaveFocus();

    // The error does not close on its own; F8 moves focus to the toasts, Tab reaches the toast, then its × button.
    const toast = title.closest("li");
    if (!toast) throw new Error("toast not found");
    await userEvent.keyboard("[F8]");
    await userEvent.tab();
    await expect(toast).toHaveFocus();
    await userEvent.tab();
    const close = within(toast).getByRole("button", { name: "Close notification" });
    await expect(close).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(toast).not.toBeInTheDocument());
    await expect(canvas.getByRole("button", { name: "Remove 2" })).toBeEnabled();
  },
};

// Delete succeeds: the skills leave the list, selection mode ends and a success toast shows.
export const DeleteSucceeds: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Remove skills" }));
    await userEvent.click(canvas.getByRole("checkbox", { name: "PostgreSQL" }));
    await userEvent.click(canvas.getByRole("button", { name: "Remove 1" }));
    const dialog = await body.findByRole("alertdialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Confirm" }));

    await expect(await toasts().findByText("Skills removed")).toBeInTheDocument();
    await waitFor(() => expect(body.queryByRole("alertdialog")).not.toBeInTheDocument());
    await expect(canvas.queryByText("PostgreSQL")).not.toBeInTheDocument();
    await expect(canvas.queryByRole("checkbox")).not.toBeInTheDocument();
  },
};
