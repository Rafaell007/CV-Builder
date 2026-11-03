import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { renderWithProviders, screen } from "@/shared/testing";
import { Textarea } from "./Textarea";

describe("Textarea", () => {
  it("is a multi-line text box named by its label", async () => {
    const { user } = renderWithProviders(<Textarea label="Description" />);
    const textarea = screen.getByRole("textbox", { name: "Description" });

    await user.type(textarea, "First line{Enter}Second line");

    expect(textarea.tagName).toBe("TEXTAREA");
    expect(textarea).toHaveValue("First line\nSecond line");
  });

  // React Hook Form's register() passes a ref and a name.
  it("passes ref and name to the textarea", () => {
    const ref = createRef<HTMLTextAreaElement>();
    renderWithProviders(<Textarea label="Description" name="description" ref={ref} />);

    expect(ref.current).toBe(screen.getByRole("textbox", { name: "Description" }));
    expect(ref.current).toHaveAttribute("name", "description");
  });

  it("marks the textarea invalid and describes it with the error", () => {
    renderWithProviders(<Textarea label="Description" error="Description is required" />);

    const textarea = screen.getByRole("textbox", { name: "Description" });
    expect(textarea).toBeInvalid();
    expect(textarea).toHaveAccessibleDescription("Description is required");
  });

  it("can be disabled", () => {
    renderWithProviders(<Textarea label="Description" disabled />);

    expect(screen.getByRole("textbox", { name: "Description" })).toBeDisabled();
  });
});
