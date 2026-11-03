import { describe, expect, it } from "vitest";
import { renderWithProviders, screen } from "@/shared/testing";
import { Field } from "./Field";
import { useFieldIds } from "./useFieldIds";

// How every field component uses Field: ids from the hook, the control as a child.
function EmailField({ helperText, error }: { helperText?: string; error?: string }) {
  const { controlId, helperId, errorId, controlProps } = useFieldIds({
    hasHelperText: Boolean(helperText),
    hasError: Boolean(error),
  });
  return (
    <Field
      label="Email"
      controlId={controlId}
      helperId={helperId}
      errorId={errorId}
      helperText={helperText}
      error={error}
    >
      <input {...controlProps} placeholder=" " />
    </Field>
  );
}

describe("Field", () => {
  it("names the control by its label, and clicking the label focuses it", async () => {
    const { user } = renderWithProviders(<EmailField />);

    await user.click(screen.getByText("Email"));

    expect(screen.getByRole("textbox", { name: "Email" })).toHaveFocus();
  });

  it("describes the control with the helper text", () => {
    renderWithProviders(<EmailField helperText="We never share it" />);

    const input = screen.getByRole("textbox", { name: "Email" });
    expect(input).toHaveAccessibleDescription("We never share it");
    expect(input).not.toBeInvalid();
  });

  it("shows the error instead of the helper text and marks the control invalid", () => {
    renderWithProviders(<EmailField helperText="We never share it" error="Email is required" />);

    const input = screen.getByRole("textbox", { name: "Email" });
    expect(input).toBeInvalid();
    expect(input).toHaveAccessibleDescription("Email is required");
    expect(screen.queryByText("We never share it")).not.toBeInTheDocument();
  });

  // A live region, so a screen reader announces an error that appears while focus is elsewhere.
  it("announces the error", () => {
    renderWithProviders(<EmailField error="Email is required" />);

    expect(screen.getByRole("alert")).toHaveTextContent("Email is required");
  });
});
