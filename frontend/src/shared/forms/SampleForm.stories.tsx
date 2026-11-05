import { CombinedGraphQLErrors } from "@apollo/client";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { Controller } from "react-hook-form";
import { expect, fn } from "storybook/test";
import { z } from "zod";
import {
  Button,
  DATE_PICKER_EXAMPLE_LABELS,
  DatePicker,
  MultiSelect,
  OtpField,
  PasswordField,
  Select,
  Textarea,
  TextField,
} from "@/shared/components";
import { applyServerFieldErrors } from "./applyServerFieldErrors";
import { useZodForm } from "./useZodForm";

// The KAN-78 demo: every form field in one React Hook Form + Zod form, with the server's field errors
// (BAD_USER_INPUT) shown under the fields. Texts and options are placeholders; a real form translates them.
// Plain inputs use `register`; controlled fields use `Controller`, which hands them value, onChange, onBlur and ref.

const DEPARTMENTS = [
  { value: "frontend", label: "Frontend" },
  { value: "backend", label: "Backend" },
  { value: "qa", label: "QA" },
];

const SKILLS = [
  { value: "react", label: "React" },
  { value: "nest", label: "NestJS" },
  { value: "postgres", label: "PostgreSQL" },
];

const MESSAGES = {
  emailRequired: "Enter an email",
  emailInvalid: "Enter a valid email",
  nameRequired: "Enter a name",
  passwordTooShort: "Password must be at least 6 characters long",
  descriptionRequired: "Enter a description",
  departmentRequired: "Choose a department",
  skillsRequired: "Choose at least one skill",
  // One message for an empty field and for typed text that is not a date: the picker holds null in both cases.
  startDateRequired: "Enter a valid start date",
  codeInvalid: "Enter the 6-digit code",
};

// Translated texts for the server's field errors; the server's English messages are never shown.
const SERVER_MESSAGES = {
  email: "This email is already taken",
  skills: "One of these skills is no longer available",
};
const SERVER_FIELDS = ["email", "skills"] as const;

const sampleSchema = z.object({
  email: z.string().trim().min(1, MESSAGES.emailRequired).pipe(z.email(MESSAGES.emailInvalid)),
  name: z.string().trim().min(1, MESSAGES.nameRequired),
  password: z.string().min(6, MESSAGES.passwordTooShort),
  description: z.string().trim().min(1, MESSAGES.descriptionRequired),
  department: z.string().min(1, MESSAGES.departmentRequired),
  skills: z.array(z.string()).min(1, MESSAGES.skillsRequired),
  // The picker holds null while empty and when the typed text is not a date; the submitted value is always a date.
  startDate: z
    .date()
    .nullable()
    .transform((date, context) => {
      if (date) return date;
      context.addIssue({ code: "custom", message: MESSAGES.startDateRequired });
      return z.NEVER;
    }),
  code: z.string().regex(/^\d{6}$/, MESSAGES.codeInvalid),
});

type SampleInput = z.input<typeof sampleSchema>;
type SampleOutput = z.output<typeof sampleSchema>;

const EMPTY: SampleInput = {
  email: "",
  name: "",
  password: "",
  description: "",
  department: "",
  skills: [],
  startDate: null,
  code: "",
};

const FILLED: SampleInput = {
  email: "ann@example.com",
  name: "Ann",
  password: "secret123",
  description: "Frontend developer",
  department: "frontend",
  skills: ["react"],
  startDate: new Date(2026, 10, 2),
  code: "123456",
};

// The "server": resolves, or rejects like Apollo does when the backend answers BAD_USER_INPUT.
function badUserInput(...fields: string[]): CombinedGraphQLErrors {
  return new CombinedGraphQLErrors({
    errors: [
      {
        message: "Bad Request Exception",
        extensions: {
          code: "BAD_USER_INPUT",
          fieldErrors: fields.map((field) => ({ field, messages: [`${field} is invalid`] })),
        },
      },
    ],
  });
}

type SampleFormProps = {
  defaultValues: SampleInput;
  submit: (values: SampleOutput) => Promise<void>;
};

// Form logic, as a feature's own hook would hold it.
function useSampleForm({ defaultValues, submit }: SampleFormProps) {
  const [generalError, setGeneralError] = useState(false);
  const form = useZodForm(sampleSchema, { defaultValues });

  const onSubmit = form.handleSubmit(async (values) => {
    setGeneralError(false);
    try {
      await submit(values);
    } catch (error) {
      const allShown = applyServerFieldErrors(error, form.setError, {
        fields: SERVER_FIELDS,
        getMessage: (field) => SERVER_MESSAGES[field as (typeof SERVER_FIELDS)[number]],
      });
      setGeneralError(!allShown);
    }
  });

  return { form, onSubmit, generalError };
}

function SampleForm(props: SampleFormProps) {
  const {
    form: {
      register,
      control,
      formState: { errors, isSubmitting },
    },
    onSubmit,
    generalError,
  } = useSampleForm(props);

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      style={{ display: "grid", gap: "var(--space-8)", maxWidth: 400 }}
    >
      <TextField {...register("email")} label="Email" type="email" error={errors.email?.message} />
      <TextField {...register("name")} label="Name" error={errors.name?.message} />
      <PasswordField
        {...register("password")}
        label="Password"
        showPasswordLabel="Show password"
        hidePasswordLabel="Hide password"
        error={errors.password?.message}
      />
      <Textarea
        {...register("description")}
        label="Description"
        error={errors.description?.message}
      />
      <Controller
        control={control}
        name="department"
        render={({ field, fieldState }) => (
          <Select
            label="Department"
            options={DEPARTMENTS}
            name={field.name}
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            ref={field.ref}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="skills"
        render={({ field, fieldState }) => (
          <MultiSelect
            label="Skills"
            options={SKILLS}
            getRemoveLabel={(option) => `Remove ${option}`}
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            ref={field.ref}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="startDate"
        render={({ field, fieldState }) => (
          <DatePicker
            label="Start date"
            locale="en"
            labels={DATE_PICKER_EXAMPLE_LABELS}
            name={field.name}
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            ref={field.ref}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="code"
        render={({ field, fieldState }) => (
          <OtpField
            label="Verification code"
            getDigitLabel={(position, length) => `Digit ${position} of ${length}`}
            name={field.name}
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            ref={field.ref}
            error={fieldState.error?.message}
          />
        )}
      />
      {generalError && <p role="alert">Something went wrong. Try again.</p>}
      <Button type="submit" loading={isSubmitting}>
        Save
      </Button>
    </form>
  );
}

const meta = {
  title: "Forms/Sample form",
  component: SampleForm,
  args: { defaultValues: EMPTY, submit: fn(async () => undefined) },
} satisfies Meta<typeof SampleForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

// Client check: every field shows its error and the first one gets the focus; nothing is sent.
export const ClientErrors: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));

    await expect(await canvas.findByText(MESSAGES.emailRequired)).toBeInTheDocument();
    for (const message of [
      MESSAGES.nameRequired,
      MESSAGES.passwordTooShort,
      MESSAGES.descriptionRequired,
      MESSAGES.departmentRequired,
      MESSAGES.skillsRequired,
      MESSAGES.startDateRequired,
      MESSAGES.codeInvalid,
    ]) {
      await expect(canvas.getByText(message)).toBeInTheDocument();
    }
    await expect(canvas.getByRole("textbox", { name: "Email" })).toHaveFocus();
    await expect(args.submit).not.toHaveBeenCalled();
  },
};

// Server check: the mocked BAD_USER_INPUT shows under Email and Skills; Email gets the focus,
// and the error clears once the user changes the field.
export const ServerErrors: Story = {
  args: {
    defaultValues: FILLED,
    submit: fn(async () => {
      throw badUserInput("email", "skills");
    }),
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));

    const email = canvas.getByRole("textbox", { name: "Email" });
    await expect(await canvas.findByText(SERVER_MESSAGES.email)).toBeInTheDocument();
    await expect(canvas.getByText(SERVER_MESSAGES.skills)).toBeInTheDocument();
    await expect(email).toHaveFocus();
    await expect(canvas.queryByText(/went wrong/)).not.toBeInTheDocument();

    await userEvent.type(email, "x");
    await expect(canvas.queryByText(SERVER_MESSAGES.email)).not.toBeInTheDocument();
  },
};

// A valid form is sent with the schema's output (trimmed strings, a real date).
export const Valid: Story = {
  args: { defaultValues: { ...FILLED, name: "  Ann  " } },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));

    await expect(args.submit).toHaveBeenCalledWith({ ...FILLED, name: "Ann" });
  },
};
