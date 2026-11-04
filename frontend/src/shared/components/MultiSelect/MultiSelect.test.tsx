import { createRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen, within } from "@/shared/testing";
import { MultiSelect, type MultiSelectProps } from "./MultiSelect";

const SKILLS = [
  { value: "react", label: "React" },
  { value: "nest", label: "NestJS" },
  { value: "pg", label: "PostgreSQL" },
  { value: "cobol", label: "COBOL", disabled: true },
];

type TestMultiSelectProps = Partial<Omit<MultiSelectProps, "value">> & {
  initialValue?: string[];
};

// MultiSelect is controlled; this holds the value the way a form (React Hook Form's Controller) does.
function TestMultiSelect({ initialValue = [], onValueChange, ...props }: TestMultiSelectProps) {
  const [value, setValue] = useState(initialValue);
  return (
    <MultiSelect
      label="Skills"
      options={SKILLS}
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onValueChange?.(next);
      }}
      getRemoveLabel={(option) => `Remove ${option}`}
      {...props}
    />
  );
}

describe("MultiSelect", () => {
  it("is a combobox named by its label, with no chips until something is chosen", () => {
    renderWithProviders(<TestMultiSelect />);

    expect(screen.getByRole("combobox", { name: "Skills" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.queryByRole("button", { name: /Remove/ })).not.toBeInTheDocument();
  });

  it("shows each chosen option as a chip, in the order chosen", () => {
    renderWithProviders(<TestMultiSelect initialValue={["pg", "react"]} />);

    const chips = screen.getByRole("group", { name: "Skills" });
    expect(
      within(chips)
        .getAllByRole("button")
        .map((button) => button.getAttribute("aria-label")),
    ).toEqual(["Remove PostgreSQL", "Remove React"]);
  });

  it("toggles options on click and keeps the list open", async () => {
    const onValueChange = vi.fn();
    const { user } = renderWithProviders(<TestMultiSelect onValueChange={onValueChange} />);

    await user.click(screen.getByRole("combobox", { name: "Skills" }));
    const list = screen.getByRole("listbox", { name: "Skills" });
    await user.click(within(list).getByRole("option", { name: "NestJS" }));
    await user.click(within(list).getByRole("option", { name: "React" }));

    expect(onValueChange).toHaveBeenLastCalledWith(["nest", "react"]);
    expect(within(list).getByRole("option", { name: "NestJS" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("combobox", { name: "Skills" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    await user.click(within(list).getByRole("option", { name: "NestJS" }));

    expect(onValueChange).toHaveBeenLastCalledWith(["react"]);
  });

  it("can be used with the keyboard", async () => {
    const onValueChange = vi.fn();
    const { user } = renderWithProviders(<TestMultiSelect onValueChange={onValueChange} />);

    await user.tab();
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{ArrowDown}{Enter}");
    await user.keyboard("{ArrowDown}{Enter}{Escape}");

    expect(onValueChange).toHaveBeenLastCalledWith(["nest", "pg"]);
    expect(screen.getByRole("combobox", { name: "Skills" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  // useSelect alone would choose the highlighted row on Tab, like a native <select>.
  it("does not choose anything when focus leaves the open list", async () => {
    const onValueChange = vi.fn();
    const { user } = renderWithProviders(<TestMultiSelect onValueChange={onValueChange} />);

    await user.tab();
    await user.keyboard("{ArrowDown}{ArrowDown}");
    await user.tab();

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("does not let a disabled option be chosen", async () => {
    const onValueChange = vi.fn();
    const { user } = renderWithProviders(<TestMultiSelect onValueChange={onValueChange} />);

    await user.click(screen.getByRole("combobox", { name: "Skills" }));
    await user.click(screen.getByRole("option", { name: "COBOL" }));

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("removes a chip with its × button", async () => {
    const onValueChange = vi.fn();
    const { user } = renderWithProviders(
      <TestMultiSelect initialValue={["react", "pg"]} onValueChange={onValueChange} />,
    );

    await user.click(screen.getByRole("button", { name: "Remove React" }));

    expect(onValueChange).toHaveBeenLastCalledWith(["pg"]);
    expect(screen.queryByRole("button", { name: "Remove React" })).not.toBeInTheDocument();
    // The × is gone; focus goes back to the field, not the page body
    expect(screen.getByRole("combobox", { name: "Skills" })).toHaveFocus();
  });

  it("removes the last chip with Backspace on the closed field", async () => {
    const onValueChange = vi.fn();
    const { user } = renderWithProviders(
      <TestMultiSelect initialValue={["react", "pg"]} onValueChange={onValueChange} />,
    );

    await user.tab();
    await user.keyboard("{Backspace}");

    expect(onValueChange).toHaveBeenLastCalledWith(["react"]);
  });

  // React Hook Form's onTouched mode validates on blur: moving inside the field is not leaving it.
  it("reports blur only when focus leaves the whole field", async () => {
    const onBlur = vi.fn();
    const { user } = renderWithProviders(
      <>
        <TestMultiSelect initialValue={["react"]} onBlur={onBlur} />
        <button type="button">Next</button>
      </>,
    );

    await user.tab();
    await user.click(screen.getByRole("combobox", { name: "Skills" }));
    await user.click(screen.getByRole("option", { name: "NestJS" }));
    // Toggle → "Remove React" → "Remove NestJS": all inside the field
    await user.tab();
    await user.tab();
    expect(onBlur).not.toHaveBeenCalled();

    await user.tab();

    expect(screen.getByRole("button", { name: "Next" })).toHaveFocus();
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it("passes the ref to the combobox", () => {
    const ref = createRef<HTMLElement>();
    renderWithProviders(<TestMultiSelect ref={ref} />);

    expect(ref.current).toBe(screen.getByRole("combobox", { name: "Skills" }));
  });

  it("marks the field invalid and describes it with the error", () => {
    renderWithProviders(<TestMultiSelect error="Choose at least one skill" />);

    const combobox = screen.getByRole("combobox", { name: "Skills" });
    expect(combobox).toHaveAttribute("aria-invalid", "true");
    expect(combobox).toHaveAccessibleDescription("Choose at least one skill");
  });

  it("can be disabled: no list, no remove buttons, out of the tab order", async () => {
    const { user } = renderWithProviders(<TestMultiSelect initialValue={["react"]} disabled />);
    const combobox = screen.getByRole("combobox", { name: "Skills" });

    await user.click(combobox);

    expect(combobox).toHaveAttribute("aria-disabled", "true");
    expect(combobox).toHaveAttribute("tabindex", "-1");
    expect(combobox).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove React" })).not.toBeInTheDocument();
  });
});
