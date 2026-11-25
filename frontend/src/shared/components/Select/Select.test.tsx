import { createRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen } from "@/shared/testing";
import { Select, type SelectProps } from "./Select";

const DEPARTMENTS = [
  { value: "dev", label: "Development" },
  { value: "qa", label: "Quality assurance" },
  { value: "hr", label: "Human resources", disabled: true },
];

type TestSelectProps = Partial<Omit<SelectProps, "value">> & { initialValue?: string };

// Select is controlled; this holds the value the way a form (React Hook Form's Controller) does.
function TestSelect({ initialValue = "", onValueChange, ...props }: TestSelectProps) {
  const [value, setValue] = useState(initialValue);
  return (
    <Select
      label="Department"
      options={DEPARTMENTS}
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onValueChange?.(next);
      }}
      {...props}
    />
  );
}

describe("Select", () => {
  it("is a combobox named by its label, empty until a value is chosen", () => {
    renderWithProviders(<TestSelect />);

    const select = screen.getByRole("combobox", { name: "Department" });
    expect(select).toHaveAttribute("aria-expanded", "false");
    expect(select).toHaveTextContent("");
  });

  it("shows the chosen option's label", () => {
    renderWithProviders(<TestSelect initialValue="qa" />);

    expect(screen.getByRole("combobox", { name: "Department" })).toHaveTextContent(
      "Quality assurance",
    );
  });

  it("opens the list on click and reports the chosen value", async () => {
    const onValueChange = vi.fn();
    const { user } = renderWithProviders(<TestSelect onValueChange={onValueChange} />);
    const select = screen.getByRole("combobox", { name: "Department" });

    await user.click(select);
    await user.click(screen.getByRole("option", { name: "Development" }));

    expect(onValueChange).toHaveBeenCalledWith("dev");
    expect(select).toHaveTextContent("Development");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("can be used with the keyboard", async () => {
    const onValueChange = vi.fn();
    const { user } = renderWithProviders(<TestSelect onValueChange={onValueChange} />);

    await user.tab();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    await user.keyboard("{ArrowDown}{Enter}");

    expect(onValueChange).toHaveBeenCalledWith("qa");
    expect(screen.getByRole("combobox", { name: "Department" })).toHaveFocus();
  });

  it("does not let a disabled option be chosen", async () => {
    const onValueChange = vi.fn();
    const { user } = renderWithProviders(<TestSelect onValueChange={onValueChange} />);

    await user.click(screen.getByRole("combobox", { name: "Department" }));
    const option = screen.getByRole("option", { name: "Human resources" });
    await user.click(option);

    expect(option).toHaveAttribute("aria-disabled", "true");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  // React Hook Form's onTouched mode validates on blur; opening the list must not count as leaving the field.
  it("reports blur when focus leaves the field, not when the list opens", async () => {
    const onBlur = vi.fn();
    const { user } = renderWithProviders(
      <>
        <TestSelect onBlur={onBlur} />
        <button type="button">Next</button>
      </>,
    );

    await user.click(screen.getByRole("combobox", { name: "Department" }));
    await user.click(screen.getByRole("option", { name: "Development" }));
    expect(onBlur).not.toHaveBeenCalled();

    await user.tab();

    expect(screen.getByRole("button", { name: "Next" })).toHaveFocus();
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  // React Hook Form focuses the first invalid field through field.ref.
  it("passes the ref to the trigger", () => {
    const ref = createRef<HTMLButtonElement>();
    renderWithProviders(<TestSelect ref={ref} />);

    expect(ref.current).toBe(screen.getByRole("combobox", { name: "Department" }));
  });

  it("marks the field invalid and describes it with the error", () => {
    renderWithProviders(<TestSelect error="Choose a department" />);

    const select = screen.getByRole("combobox", { name: "Department" });
    expect(select).toHaveAttribute("aria-invalid", "true");
    expect(select).toHaveAccessibleDescription("Choose a department");
  });

  // Another employee's profile: the value is shown and reachable by keyboard, but cannot change.
  it("stays focusable but never opens or changes when read-only", async () => {
    const onValueChange = vi.fn();
    const { user } = renderWithProviders(
      <TestSelect initialValue="dev" readOnly onValueChange={onValueChange} />,
    );
    const select = screen.getByRole("combobox", { name: "Department" });

    await user.tab();
    expect(select).toHaveFocus();
    await user.keyboard("{Enter}{ArrowDown} q");
    await user.click(select);

    expect(select).toHaveAttribute("aria-readonly", "true");
    expect(select).toBeEnabled();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(onValueChange).not.toHaveBeenCalled();
    expect(select).toHaveTextContent("Development");
  });

  it("reports blur when focus leaves a read-only field", async () => {
    const onBlur = vi.fn();
    const { user } = renderWithProviders(<TestSelect readOnly onBlur={onBlur} />);

    await user.tab();
    await user.tab();

    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it("does not open when disabled", async () => {
    const { user } = renderWithProviders(<TestSelect disabled />);
    const select = screen.getByRole("combobox", { name: "Department" });

    await user.click(select);

    expect(select).toBeDisabled();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
