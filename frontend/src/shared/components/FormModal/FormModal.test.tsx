import { CombinedGraphQLErrors } from "@apollo/client";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { applyServerFieldErrors, useZodForm } from "@/shared/forms";
import { renderWithProviders, screen } from "@/shared/testing";
import { Button } from "../Button";
import { TextField } from "../TextField";
import { FormModal } from "./FormModal";

const schema = z.object({ name: z.string().trim().min(1, "Enter a name") });
type Values = z.input<typeof schema>;

const nameTaken = new CombinedGraphQLErrors({
  errors: [
    {
      message: "Bad Request Exception",
      extensions: {
        code: "BAD_USER_INPUT",
        fieldErrors: [{ field: "name", messages: ["name is taken"] }],
      },
    },
  ],
});

// The caller, as a page's hook and component would wire it.
function AddSkillModal({ submit }: { submit: (values: Values) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const form = useZodForm(schema, { defaultValues: { name: "" } });
  const { isValid, isDirty, isSubmitting, errors } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await submit(values);
      setOpen(false);
    } catch (error) {
      applyServerFieldErrors(error, form.setError, {
        fields: ["name"],
        getMessage: () => "This name is already taken",
      });
    }
  });

  return (
    <>
      <Button
        onClick={() => {
          form.reset();
          setOpen(true);
        }}
      >
        Add skill
      </Button>
      <FormModal
        open={open}
        onOpenChange={setOpen}
        title="Add skill"
        closeLabel="Close"
        submitLabel="Add"
        cancelLabel="Cancel"
        canSubmit={isValid && isDirty}
        isSubmitting={isSubmitting}
        onSubmit={onSubmit}
      >
        <TextField {...form.register("name")} label="Name" error={errors.name?.message} />
      </FormModal>
    </>
  );
}

async function renderOpen(submit = vi.fn<(values: Values) => Promise<void>>()) {
  const rendered = renderWithProviders(<AddSkillModal submit={submit} />);
  await rendered.user.click(screen.getByRole("button", { name: "Add skill" }));
  return { ...rendered, submit };
}

describe("FormModal", () => {
  it("focuses the first field when it opens", async () => {
    await renderOpen();

    expect(screen.getByRole("dialog", { name: "Add skill" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveFocus();
  });

  it("enables the submit button only while the form is valid and changed", async () => {
    const { user } = await renderOpen();
    const add = screen.getByRole("button", { name: "Add" });
    expect(add).toBeDisabled();

    await user.type(screen.getByRole("textbox", { name: "Name" }), "React");
    expect(add).toBeEnabled();

    await user.clear(screen.getByRole("textbox", { name: "Name" }));
    expect(add).toBeDisabled();
  });

  it("submits with Enter and closes after a successful request", async () => {
    const { user, submit } = await renderOpen(vi.fn().mockResolvedValue(undefined));

    await user.type(screen.getByRole("textbox", { name: "Name" }), "React{Enter}");

    expect(submit).toHaveBeenCalledExactlyOnceWith({ name: "React" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("keeps the values and shows the server's field error after a failed request", async () => {
    const { user } = await renderOpen(vi.fn().mockRejectedValue(nameTaken));

    await user.type(screen.getByRole("textbox", { name: "Name" }), "React");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("React");
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveAccessibleDescription(
      "This name is already taken",
    );
  });

  it("shows loading and sends one request while the first is pending", async () => {
    const { user, submit } = await renderOpen(vi.fn(() => new Promise<void>(() => {})));

    await user.type(screen.getByRole("textbox", { name: "Name" }), "React");
    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.type(screen.getByRole("textbox", { name: "Name" }), "{Enter}");

    expect(screen.getByRole("button", { name: "Add" })).toHaveAttribute("aria-busy", "true");
    expect(submit).toHaveBeenCalledOnce();
  });

  it("does not close with CANCEL, × or Escape while the request is pending", async () => {
    const { user } = await renderOpen(vi.fn(() => new Promise<void>(() => {})));

    await user.type(screen.getByRole("textbox", { name: "Name" }), "React");
    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await user.click(screen.getByRole("button", { name: "Close" }));
    await user.keyboard("{Escape}");

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("closes with CANCEL without sending", async () => {
    const { user, submit } = await renderOpen();

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(submit).not.toHaveBeenCalled();
  });
});
