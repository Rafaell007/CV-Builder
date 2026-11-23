import { CombinedGraphQLErrors } from "@apollo/client";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { Controller } from "react-hook-form";
import { expect, userEvent, within } from "storybook/test";
import { z } from "zod";
import { applyServerFieldErrors, useZodForm } from "@/shared/forms";
import { Button } from "../Button";
import { Select } from "../Select";
import { FormModal } from "./FormModal";

// The Add skill modal of docs/pages/12-user-skills-page.md with placeholder texts.
const SKILLS = [
  { value: "react", label: "React" },
  { value: "nest", label: "NestJS" },
];
const LEVELS = [
  { value: "novice", label: "Novice" },
  { value: "expert", label: "Expert" },
];

const schema = z.object({
  skill: z.string().min(1, "Choose a skill"),
  level: z.string().min(1, "Choose a level"),
});
type Values = z.input<typeof schema>;

const skillTaken = new CombinedGraphQLErrors({
  errors: [
    {
      message: "Bad Request Exception",
      extensions: {
        code: "BAD_USER_INPUT",
        fieldErrors: [{ field: "skill", messages: ["skill is already assigned"] }],
      },
    },
  ],
});

type AddSkillDemoProps = { fails: boolean };

function AddSkillDemo({ fails }: AddSkillDemoProps) {
  const [open, setOpen] = useState(false);
  const form = useZodForm(schema, { defaultValues: { skill: "", level: "" } });
  const { isValid, isDirty, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async () => {
    // The "server": answers after a short delay, so the loading state is visible.
    await new Promise((resolve) => setTimeout(resolve, 300));
    if (!fails) {
      setOpen(false);
      return;
    }
    applyServerFieldErrors(skillTaken, form.setError, {
      fields: ["skill"],
      getMessage: () => "This skill is already assigned",
    });
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
        {(["skill", "level"] as const satisfies ReadonlyArray<keyof Values>).map((name) => (
          <Controller
            key={name}
            control={form.control}
            name={name}
            render={({ field, fieldState }) => (
              <Select
                label={name === "skill" ? "Skill" : "Mastery"}
                options={name === "skill" ? SKILLS : LEVELS}
                name={field.name}
                value={field.value}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
                error={fieldState.error?.message}
              />
            )}
          />
        ))}
      </FormModal>
    </>
  );
}

const meta = {
  title: "Shared/FormModal",
  component: AddSkillDemo,
  args: { fails: false },
} satisfies Meta<typeof AddSkillDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

const body = within(document.body);

async function openAndFill(canvas: ReturnType<typeof within>) {
  await userEvent.click(canvas.getByRole("button", { name: "Add skill" }));
  const dialog = await body.findByRole("dialog", { name: "Add skill" });
  await expect(within(dialog).getByRole("button", { name: "Add" })).toBeDisabled();
  await userEvent.click(within(dialog).getByRole("combobox", { name: "Skill" }));
  await userEvent.click(await body.findByRole("option", { name: "React" }));
  await userEvent.click(within(dialog).getByRole("combobox", { name: "Mastery" }));
  await userEvent.click(await body.findByRole("option", { name: "Expert" }));
  return dialog;
}

export const Default: Story = {};

export const Dark: Story = { globals: { theme: "dark" } };

export const SuccessfulSubmit: Story = {
  play: async ({ canvas }) => {
    const dialog = await openAndFill(canvas);
    await userEvent.click(within(dialog).getByRole("button", { name: "Add" }));
    await expect(await body.findByRole("button", { name: "Add skill" })).toBeInTheDocument();
    await expect(body.queryByRole("dialog")).not.toBeInTheDocument();
  },
};

export const ServerFieldError: Story = {
  args: { fails: true },
  play: async ({ canvas }) => {
    const dialog = await openAndFill(canvas);
    await userEvent.click(within(dialog).getByRole("button", { name: "Add" }));
    await expect(await within(dialog).findByText("This skill is already assigned")).toBeVisible();
    await expect(within(dialog).getByRole("combobox", { name: "Skill" })).toHaveTextContent(
      "React",
    );
  },
};
