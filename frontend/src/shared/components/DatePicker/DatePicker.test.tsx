import { createRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen, within } from "@/shared/testing";
import { DatePicker, type DatePickerProps } from "./DatePicker";
import type { DatePickerLabels } from "./datePicker.types";

const LABELS: DatePickerLabels = {
  calendar: "Choose a date",
  previousMonth: "Previous month",
  nextMonth: "Next month",
  previousYears: "Previous years",
  nextYears: "Next years",
  chooseDayPrefix: "Choose",
  unavailableDayPrefix: "Not available",
  monthPrefix: "Month",
};

// Wednesday, 4 November 2026
const NOV_4 = new Date(2026, 10, 4);

type TestDatePickerProps = Partial<Omit<DatePickerProps, "value">> & {
  initialValue?: Date | null;
};

// DatePicker is controlled; this holds the value the way a form (React Hook Form's Controller) does.
function TestDatePicker({ initialValue = NOV_4, onValueChange, ...props }: TestDatePickerProps) {
  const [value, setValue] = useState(initialValue);
  return (
    <DatePicker
      label="Start date"
      locale="en"
      labels={LABELS}
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onValueChange?.(next);
      }}
      {...props}
    />
  );
}

describe("DatePicker", () => {
  it("is a text box named by its label, showing the date in the locale's short format", () => {
    renderWithProviders(<TestDatePicker />);

    expect(screen.getByRole("textbox", { name: "Start date" })).toHaveValue("04/11/2026");
  });

  it("uses the Polish format and names in pl", async () => {
    const { user } = renderWithProviders(<TestDatePicker locale="pl" />);
    const input = screen.getByRole("textbox", { name: "Start date" });

    await user.click(input);

    expect(input).toHaveValue("04.11.2026");
    expect(screen.getByRole("button", { name: "listopad" })).toBeInTheDocument();
  });

  it("opens a calendar named by the translated label and picks a day", async () => {
    const onValueChange = vi.fn();
    const { user } = renderWithProviders(<TestDatePicker onValueChange={onValueChange} />);

    await user.click(screen.getByRole("textbox", { name: "Start date" }));
    const calendar = screen.getByRole("dialog", { name: "Choose a date" });
    await user.click(within(calendar).getByRole("gridcell", { name: /20 November 2026/ }));

    expect(onValueChange).toHaveBeenCalledWith(new Date(2026, 10, 20));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("pages months with the arrows", async () => {
    const { user } = renderWithProviders(<TestDatePicker />);

    await user.click(screen.getByRole("textbox", { name: "Start date" }));
    await user.click(screen.getByRole("button", { name: "Next month" }));

    expect(screen.getByRole("button", { name: "December" })).toBeInTheDocument();
  });

  it("picks a year, then a month, then a day", async () => {
    const onValueChange = vi.fn();
    const { user } = renderWithProviders(<TestDatePicker onValueChange={onValueChange} />);

    await user.click(screen.getByRole("textbox", { name: "Start date" }));
    await user.click(screen.getByRole("button", { name: "2026" }));
    await user.click(screen.getByRole("button", { name: "Previous years" }));
    // The header button shows the paged year too; click the one in the list
    await user.click(screen.getAllByText("2014").at(-1)!);
    await user.click(screen.getByText("Mar"));
    await user.click(screen.getByRole("gridcell", { name: /15 March 2014/ }));

    expect(onValueChange).toHaveBeenCalledOnce();
    expect(onValueChange).toHaveBeenCalledWith(new Date(2014, 2, 15));
  });

  it("can be used with the keyboard", async () => {
    const onValueChange = vi.fn();
    const { user } = renderWithProviders(<TestDatePicker onValueChange={onValueChange} />);

    await user.tab();
    expect(screen.getByRole("dialog", { name: "Choose a date" })).toBeInTheDocument();
    // The first Down moves focus from the input into the calendar (on the 4th);
    // then Down moves a week and Right a day: 4 → 11 → 12 November
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("gridcell", { name: /\b4 November 2026/ })).toHaveFocus();
    await user.keyboard("{ArrowDown}{ArrowRight}{Enter}");

    expect(onValueChange).toHaveBeenLastCalledWith(new Date(2026, 10, 12));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("takes a typed date", async () => {
    const onValueChange = vi.fn();
    const { user } = renderWithProviders(
      <TestDatePicker initialValue={null} onValueChange={onValueChange} />,
    );

    await user.type(screen.getByRole("textbox", { name: "Start date" }), "15/01/2027");

    expect(onValueChange).toHaveBeenLastCalledWith(new Date(2027, 0, 15));
  });

  it("marks days outside minDate as not available", async () => {
    const onValueChange = vi.fn();
    const { user } = renderWithProviders(
      <TestDatePicker minDate={new Date(2026, 10, 3)} onValueChange={onValueChange} />,
    );

    await user.click(screen.getByRole("textbox", { name: "Start date" }));
    const day = screen.getByRole("gridcell", { name: /Not available .*\b2 November 2026/ });
    await user.click(day);

    expect(day).toHaveAttribute("aria-disabled", "true");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  // React Hook Form's onTouched mode validates on blur: using the calendar is not leaving the field.
  it("reports blur only when focus leaves the field and its calendar", async () => {
    const onBlur = vi.fn();
    const { user } = renderWithProviders(
      <>
        <TestDatePicker onBlur={onBlur} />
        <button type="button">Next</button>
      </>,
    );

    await user.click(screen.getByRole("textbox", { name: "Start date" }));
    await user.click(screen.getByRole("button", { name: "Next month" }));
    expect(onBlur).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it("passes the ref to the input", () => {
    const ref = createRef<HTMLInputElement>();
    renderWithProviders(<TestDatePicker ref={ref} />);

    expect(ref.current).toBe(screen.getByRole("textbox", { name: "Start date" }));
  });

  it("marks the input invalid and describes it with the error", () => {
    renderWithProviders(<TestDatePicker initialValue={null} error="Enter a start date" />);

    const input = screen.getByRole("textbox", { name: "Start date" });
    expect(input).toBeInvalid();
    expect(input).toHaveAccessibleDescription("Enter a start date");
  });

  it("can be disabled", async () => {
    const { user } = renderWithProviders(<TestDatePicker disabled />);
    const input = screen.getByRole("textbox", { name: "Start date" });

    await user.click(input);

    expect(input).toBeDisabled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
