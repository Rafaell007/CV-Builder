import { createRef, type FormEvent } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen, waitFor } from "@/shared/testing";
import { PasswordField, type PasswordFieldProps } from "./PasswordField";

const LABELS = { showPasswordLabel: "Show password", hidePasswordLabel: "Hide password" };

function renderPasswordField(props: Partial<PasswordFieldProps> = {}) {
  return renderWithProviders(<PasswordField label="Password" {...LABELS} {...props} />);
}

describe("PasswordField", () => {
  it("masks the value by default", () => {
    renderPasswordField();

    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
    expect(screen.getByRole("button", { name: "Show password" })).toBeInTheDocument();
  });

  it("shows the value with the eye button and returns focus to the input", async () => {
    const { user } = renderPasswordField();
    const input = screen.getByLabelText("Password");

    await user.click(screen.getByRole("button", { name: "Show password" }));

    expect(input).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Hide password" })).toBeInTheDocument();
    await waitFor(() => expect(input).toHaveFocus());
  });

  it("toggles from the keyboard and keeps focus on the button", async () => {
    const { user } = renderPasswordField();

    await user.tab();
    await user.tab();
    await user.keyboard("{Enter}");

    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Hide password" })).toHaveFocus();
  });

  it("masks the value again when its form is submitted", async () => {
    const onSubmit = vi.fn((event: FormEvent) => event.preventDefault());
    const { user } = renderWithProviders(
      <form onSubmit={onSubmit}>
        <PasswordField label="Password" {...LABELS} />
        <button type="submit">Sign in</button>
      </form>,
    );

    await user.click(screen.getByRole("button", { name: "Show password" }));
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(onSubmit).toHaveBeenCalledOnce();
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
  });

  // React Hook Form's register() passes a ref and a name.
  it("passes ref, name and autoComplete to the input", () => {
    const ref = createRef<HTMLInputElement>();
    renderPasswordField({ ref, name: "password", autoComplete: "new-password" });

    const input = screen.getByLabelText("Password");
    expect(ref.current).toBe(input);
    expect(input).toHaveAttribute("name", "password");
    expect(input).toHaveAttribute("autocomplete", "new-password");
  });

  it("suggests the saved password by default", () => {
    renderPasswordField();

    expect(screen.getByLabelText("Password")).toHaveAttribute("autocomplete", "current-password");
  });

  it("marks the input invalid and describes it with the error", () => {
    renderPasswordField({ error: "Password is required" });

    const input = screen.getByLabelText("Password");
    expect(input).toBeInvalid();
    expect(input).toHaveAccessibleDescription("Password is required");
  });

  it("disables the input and the eye button together", () => {
    renderPasswordField({ disabled: true });

    expect(screen.getByLabelText("Password")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Show password" })).toBeDisabled();
  });
});
