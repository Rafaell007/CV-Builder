import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { TextField } from "@/shared/components";
import { renderWithProviders, screen } from "@/shared/testing";
import { useZodForm } from "./useZodForm";

const schema = z.object({ name: z.string().trim().min(1, "Name is required") });

type NameFormProps = { onValid: (values: z.output<typeof schema>) => void };

function NameForm({ onValid }: NameFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useZodForm(schema, { defaultValues: { name: "" } });

  return (
    <form onSubmit={handleSubmit((values) => onValid(values))} noValidate>
      <TextField {...register("name")} label="Name" error={errors.name?.message} />
      <button type="submit">Save</button>
    </form>
  );
}

describe("useZodForm", () => {
  it("shows the schema's message once the field was left", async () => {
    const { user } = renderWithProviders(<NameForm onValid={vi.fn()} />);
    const input = screen.getByRole("textbox", { name: "Name" });

    await user.click(input);
    expect(input).toBeValid();

    await user.tab();

    expect(input).toBeInvalid();
    expect(input).toHaveAccessibleDescription("Name is required");
  });

  it("updates the error while the user types", async () => {
    const { user } = renderWithProviders(<NameForm onValid={vi.fn()} />);
    const input = screen.getByRole("textbox", { name: "Name" });
    await user.click(input);
    await user.tab();

    await user.type(input, "A");

    expect(input).toBeValid();
  });

  it("does not submit invalid values", async () => {
    const onValid = vi.fn();
    const { user } = renderWithProviders(<NameForm onValid={onValid} />);

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByRole("textbox", { name: "Name" })).toBeInvalid();
    expect(onValid).not.toHaveBeenCalled();
  });

  it("submits the schema's output", async () => {
    const onValid = vi.fn();
    const { user } = renderWithProviders(<NameForm onValid={onValid} />);

    await user.type(screen.getByRole("textbox", { name: "Name" }), "  Ann  ");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onValid).toHaveBeenCalledExactlyOnceWith({ name: "Ann" });
  });
});
