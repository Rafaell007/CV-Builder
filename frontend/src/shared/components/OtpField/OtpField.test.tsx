import { createRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen } from "@/shared/testing";
import { OtpField, type OtpFieldProps } from "./OtpField";

// Keeps the value like a real page does; the field itself is controlled.
function Harness(props: Partial<OtpFieldProps>) {
  const [value, setValue] = useState("");
  return (
    <>
      <OtpField
        label="Verification code"
        getDigitLabel={(position, length) => `Digit ${position} of ${length}`}
        value={value}
        onValueChange={setValue}
        {...props}
      />
      <output aria-label="current value">{value}</output>
    </>
  );
}

const box = (position: number) => screen.getByRole("textbox", { name: `Digit ${position} of 6` });
const currentValue = () => screen.getByLabelText("current value");

describe("OtpField", () => {
  it("shows six named boxes inside a named group", () => {
    renderWithProviders(<Harness />);

    expect(screen.getByRole("group", { name: "Verification code" })).toBeInTheDocument();
    expect(screen.getAllByRole("textbox")).toHaveLength(6);
    expect(box(1)).toBeInTheDocument();
    expect(box(6)).toBeInTheDocument();
  });

  it("moves the focus to the next box while the user types", async () => {
    const { user } = renderWithProviders(<Harness />);

    await user.click(box(1));
    await user.keyboard("12");

    expect(box(1)).toHaveValue("1");
    expect(box(2)).toHaveValue("2");
    expect(box(3)).toHaveFocus();
    expect(currentValue()).toHaveTextContent("12");
  });

  it("ignores characters that are not digits", async () => {
    const { user } = renderWithProviders(<Harness />);

    await user.click(box(1));
    await user.keyboard("a-1");

    expect(currentValue()).toHaveTextContent("1");
  });

  it("spreads a pasted code over the boxes", async () => {
    const { user } = renderWithProviders(<Harness />);

    await user.click(box(1));
    await user.paste("123456");

    expect(currentValue()).toHaveTextContent("123456");
    expect(box(1)).toHaveValue("1");
    expect(box(6)).toHaveValue("6");
  });

  it("goes back one box on Backspace", async () => {
    const { user } = renderWithProviders(<Harness />);

    await user.click(box(1));
    await user.keyboard("12");
    await user.keyboard("{Backspace}");

    expect(currentValue()).toHaveTextContent("1");
  });

  it("marks every box invalid and shows the error", () => {
    renderWithProviders(<Harness error="Invalid verification code" />);

    expect(screen.getByRole("alert")).toHaveTextContent("Invalid verification code");
    for (const textbox of screen.getAllByRole("textbox")) {
      expect(textbox).toHaveAttribute("aria-invalid", "true");
      expect(textbox).toHaveAccessibleDescription("Invalid verification code");
    }
  });

  it("disables every box", () => {
    renderWithProviders(<Harness disabled />);

    for (const textbox of screen.getAllByRole("textbox")) expect(textbox).toBeDisabled();
  });

  it("does not report a blur while the focus moves between the boxes", async () => {
    const onBlur = vi.fn();
    const { user } = renderWithProviders(<Harness onBlur={onBlur} />);

    await user.click(box(1));
    await user.keyboard("12");

    expect(box(3)).toHaveFocus();
    expect(onBlur).not.toHaveBeenCalled();
  });

  it("reports a blur once when the focus leaves all the boxes", async () => {
    const onBlur = vi.fn();
    const { user } = renderWithProviders(
      <>
        <Harness onBlur={onBlur} />
        <button type="button">Next</button>
      </>,
    );

    await user.click(box(1));
    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(onBlur).toHaveBeenCalledOnce();
  });

  it("gives the first box to the ref, so a form can focus the field", () => {
    const ref = createRef<HTMLInputElement>();
    renderWithProviders(<Harness ref={ref} />);

    ref.current?.focus();

    expect(box(1)).toHaveFocus();
  });

  it("supports another length", () => {
    renderWithProviders(<Harness length={4} />);

    expect(screen.getAllByRole("textbox")).toHaveLength(4);
  });
});
