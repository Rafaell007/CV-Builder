import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen } from "@/shared/testing";
import { TextField } from "./TextField";

describe("TextField", () => {
  it("is a text box named by its label", () => {
    renderWithProviders(<TextField label="Email" type="email" />);

    expect(screen.getByRole("textbox", { name: "Email" })).toHaveAttribute("type", "email");
  });

  it("reports what the user types", async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(<TextField label="First name" onChange={onChange} />);
    const input = screen.getByRole("textbox", { name: "First name" });

    await user.type(input, "Ann");

    expect(input).toHaveValue("Ann");
    expect(onChange).toHaveBeenCalledTimes(3);
  });

  // React Hook Form's register() passes a ref and a name.
  it("passes ref and name to the input", () => {
    const ref = createRef<HTMLInputElement>();
    renderWithProviders(<TextField label="Email" name="email" ref={ref} />);

    expect(ref.current).toBe(screen.getByRole("textbox", { name: "Email" }));
    expect(ref.current).toHaveAttribute("name", "email");
  });

  it("uses the given id", () => {
    renderWithProviders(<TextField label="Email" id="sign-in-email" />);

    expect(screen.getByRole("textbox", { name: "Email" })).toHaveAttribute("id", "sign-in-email");
  });

  it("marks the input invalid and describes it with the error", () => {
    renderWithProviders(<TextField label="Email" error="Email is required" />);

    const input = screen.getByRole("textbox", { name: "Email" });
    expect(input).toBeInvalid();
    expect(input).toHaveAccessibleDescription("Email is required");
  });

  it("keeps the caller's aria-describedby next to the error", () => {
    renderWithProviders(
      <>
        <p id="hint">Use your work address</p>
        <TextField label="Email" error="Email is required" aria-describedby="hint" />
      </>,
    );

    expect(screen.getByRole("textbox", { name: "Email" })).toHaveAccessibleDescription(
      "Email is required Use your work address",
    );
  });

  it("stays focusable but cannot be changed when read-only", async () => {
    const { user } = renderWithProviders(
      <TextField label="First name" defaultValue="Ann" readOnly />,
    );
    const input = screen.getByRole("textbox", { name: "First name" });

    await user.tab();
    await user.keyboard("x");

    expect(input).toHaveFocus();
    expect(input).toHaveAttribute("readonly");
    expect(input).toHaveValue("Ann");
  });

  it("can be disabled", () => {
    renderWithProviders(<TextField label="Email" disabled />);

    expect(screen.getByRole("textbox", { name: "Email" })).toBeDisabled();
  });
});
