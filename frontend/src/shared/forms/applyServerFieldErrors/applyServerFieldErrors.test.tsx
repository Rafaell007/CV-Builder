import { CombinedGraphQLErrors } from "@apollo/client";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { TextField } from "@/shared/components";
import { renderWithProviders, screen } from "@/shared/testing";
import { useZodForm } from "../useZodForm";
import { applyServerFieldErrors } from "./applyServerFieldErrors";

const schema = z.object({ email: z.string(), name: z.string() });

const MESSAGES = { email: "This email cannot be used", name: "This name cannot be used" };

function badUserInput(...fields: string[]): CombinedGraphQLErrors {
  return new CombinedGraphQLErrors({
    errors: [
      {
        message: "Bad input",
        extensions: {
          code: "BAD_USER_INPUT",
          fieldErrors: fields.map((field) => ({ field, messages: [`${field} is invalid`] })),
        },
      },
    ],
  });
}

// Submits valid values; the "server" answers with the given error.
function ProfileForm({ serverError }: { serverError: unknown }) {
  const [allShown, setAllShown] = useState<boolean | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useZodForm(schema, { defaultValues: { email: "ann@example.com", name: "Ann" } });

  const onSubmit = handleSubmit(() => {
    setAllShown(
      applyServerFieldErrors(serverError, setError, {
        fields: ["email", "name"],
        getMessage: (field) => MESSAGES[field],
      }),
    );
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <TextField {...register("name")} label="Name" error={errors.name?.message} />
      <TextField {...register("email")} label="Email" error={errors.email?.message} />
      <button type="submit">Save</button>
      {allShown === false && <p>General error</p>}
    </form>
  );
}

describe("applyServerFieldErrors", () => {
  it("shows the form's message under each field the server rejected", async () => {
    const { user } = renderWithProviders(<ProfileForm serverError={badUserInput("email")} />);

    await user.click(screen.getByRole("button", { name: "Save" }));

    const email = screen.getByRole("textbox", { name: "Email" });
    expect(email).toBeInvalid();
    expect(email).toHaveAccessibleDescription("This email cannot be used");
    expect(screen.getByRole("textbox", { name: "Name" })).toBeValid();
    expect(screen.queryByText("General error")).not.toBeInTheDocument();
  });

  it("focuses the first rejected field", async () => {
    const { user } = renderWithProviders(
      <ProfileForm serverError={badUserInput("email", "name")} />,
    );

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByRole("textbox", { name: "Email" })).toHaveFocus();
    expect(screen.getByRole("textbox", { name: "Name" })).toBeInvalid();
  });

  it("clears the server error when the user changes the field", async () => {
    const { user } = renderWithProviders(<ProfileForm serverError={badUserInput("email")} />);
    await user.click(screen.getByRole("button", { name: "Save" }));
    const email = screen.getByRole("textbox", { name: "Email" });

    await user.type(email, "x");

    expect(email).toBeValid();
  });

  it("asks for a general error when a rejected field is not in the form", async () => {
    const { user } = renderWithProviders(
      <ProfileForm serverError={badUserInput("email", "page.size")} />,
    );

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByRole("textbox", { name: "Email" })).toBeInvalid();
    expect(screen.getByText("General error")).toBeInTheDocument();
  });

  it("asks for a general error for any other error", async () => {
    const { user } = renderWithProviders(
      <ProfileForm serverError={new TypeError("Failed to fetch")} />,
    );

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByRole("textbox", { name: "Email" })).toBeValid();
    expect(screen.getByText("General error")).toBeInTheDocument();
  });
});
