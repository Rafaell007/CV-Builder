import { createRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen, within } from "@/shared/testing";
import { DatePicker, type DatePickerProps } from "./DatePicker";
import { DATE_PICKER_EXAMPLE_LABELS as LABELS } from "./datePicker.fixtures";

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

// A start and an end date linked the way the project forms link them (docs/pages/23): the end cannot be
// before the start, and the start cannot be after the end. An empty side sets no limit.
function TestDateRange() {
  const [start, setStart] = useState<Date | null>(new Date(2026, 10, 10));
  const [end, setEnd] = useState<Date | null>(null);
  return (
    <>
      <DatePicker
        label="Start date"
        locale="en"
        labels={LABELS}
        value={start}
        onValueChange={setStart}
        maxDate={end ?? undefined}
      />
      <DatePicker
        label="End date"
        locale="en"
        labels={LABELS}
        value={end}
        onValueChange={setEnd}
        minDate={start ?? undefined}
      />
    </>
  );
}

describe("DatePicker", () => {
  it("is a text box named by its label, showing the date in the locale's format (en month first)", () => {
    renderWithProviders(<TestDatePicker />);

    expect(screen.getByRole("textbox", { name: "Start date" })).toHaveValue("11/04/2026");
  });

  it("uses the Polish format and names in pl", async () => {
    const { user } = renderWithProviders(<TestDatePicker locale="pl" />);
    const input = screen.getByRole("textbox", { name: "Start date" });

    await user.click(input);

    expect(input).toHaveValue("04.11.2026");
    expect(screen.getByRole("button", { name: "listopad" })).toBeInTheDocument();
  });

  it("opens a calendar named by the translated label, picks a day and saves it", async () => {
    const onValueChange = vi.fn();
    const { user } = renderWithProviders(<TestDatePicker onValueChange={onValueChange} />);

    await user.click(screen.getByRole("textbox", { name: "Start date" }));
    const calendar = screen.getByRole("dialog", { name: "Choose a date" });
    await user.click(within(calendar).getByRole("gridcell", { name: /20 November 2026/ }));

    expect(onValueChange).toHaveBeenCalledWith(new Date(2026, 10, 20));
    // Not closed: the month step follows
    expect(screen.getByRole("dialog", { name: "Choose a date" })).toBeInTheDocument();
  });

  it("pages months with the arrows", async () => {
    const { user } = renderWithProviders(<TestDatePicker />);

    await user.click(screen.getByRole("textbox", { name: "Start date" }));
    await user.click(screen.getByRole("button", { name: "Next month" }));

    expect(screen.getByRole("button", { name: "December" })).toBeInTheDocument();
  });

  it("starts the week on Sunday", async () => {
    const { user } = renderWithProviders(<TestDatePicker />);

    await user.click(screen.getByRole("textbox", { name: "Start date" }));

    // 1 November 2026 is a Sunday: it is the first cell, not 26 October
    expect(screen.getAllByRole("gridcell")[0]).toHaveAccessibleName(/\b1 November 2026/);
  });

  it("shows full month names in the month list", async () => {
    const { user } = renderWithProviders(<TestDatePicker />);

    await user.click(screen.getByRole("textbox", { name: "Start date" }));
    await user.click(screen.getByRole("button", { name: "November" }));

    expect(screen.getByText("January")).toBeInTheDocument();
    expect(screen.getByText("December")).toBeInTheDocument();
  });

  it("marks its box with data-calendar-open only while the calendar is open", async () => {
    const { user } = renderWithProviders(<TestDatePicker />);
    const input = screen.getByRole("textbox", { name: "Start date" });
    const marked = () => input.closest("[data-calendar-open]");

    expect(marked()).toBeNull();
    await user.click(input);
    expect(marked()).not.toBeNull();
    await user.keyboard("{Escape}");
    expect(marked()).toBeNull();
  });

  describe("arrows of the month list", () => {
    it("move the saved date by one month, over the year end in both directions", async () => {
      const onValueChange = vi.fn();
      const { user } = renderWithProviders(<TestDatePicker onValueChange={onValueChange} />);
      const input = screen.getByRole("textbox", { name: "Start date" });

      await user.click(input);
      await user.click(screen.getByRole("button", { name: "November" }));
      await user.click(screen.getByRole("button", { name: "Next month" }));

      expect(onValueChange).toHaveBeenLastCalledWith(new Date(2026, 11, 4));
      expect(input).toHaveValue("12/04/2026");
      expect(screen.getByRole("button", { name: "December" })).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Next month" }));

      expect(input).toHaveValue("01/04/2027");
      expect(screen.getByRole("button", { name: "January" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "2027" })).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Previous month" }));

      expect(input).toHaveValue("12/04/2026");
      expect(screen.getByRole("button", { name: "2026" })).toBeInTheDocument();
    });

    it("keep the calendar open on the month list", async () => {
      const { user } = renderWithProviders(<TestDatePicker />);

      await user.click(screen.getByRole("textbox", { name: "Start date" }));
      await user.click(screen.getByRole("button", { name: "November" }));
      await user.click(screen.getByRole("button", { name: "Next month" }));

      expect(screen.getByRole("dialog", { name: "Choose a date" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "December" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    });

    it("start from the shown month when the field is empty", async () => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date(2026, 10, 5, 12));
      try {
        const { user } = renderWithProviders(<TestDatePicker initialValue={null} />);
        const input = screen.getByRole("textbox", { name: "Start date" });

        await user.click(input);
        await user.click(screen.getByRole("button", { name: "November" }));
        await user.click(screen.getByRole("button", { name: "Next month" }));

        expect(input).toHaveValue("12/05/2026");
      } finally {
        vi.useRealTimers();
      }
    });

    it("are disabled when the whole month is outside minDate", async () => {
      const { user } = renderWithProviders(<TestDatePicker minDate={new Date(2026, 10, 3)} />);

      await user.click(screen.getByRole("textbox", { name: "Start date" }));
      await user.click(screen.getByRole("button", { name: "November" }));

      expect(screen.getByRole("button", { name: "Previous month" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Next month" })).toBeEnabled();
    });
  });

  it("moves the saved date through the year list and pages it at the end of the page", async () => {
    const { user } = renderWithProviders(<TestDatePicker />);
    const input = screen.getByRole("textbox", { name: "Start date" });

    await user.click(input);
    await user.click(screen.getByRole("button", { name: "2026" }));
    // The page of 2026 is 2017 to 2028
    expect(screen.getByText("2017")).toBeInTheDocument();
    expect(screen.queryByText("2029")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next year" }));
    await user.click(screen.getByRole("button", { name: "Next year" }));
    expect(input).toHaveValue("11/04/2028");
    expect(screen.getByText("2017")).toBeInTheDocument();

    // 2028 was the last year of the page: the next click moves on to the next page
    await user.click(screen.getByRole("button", { name: "Next year" }));
    expect(input).toHaveValue("11/04/2029");
    expect(screen.getByText("2040")).toBeInTheDocument();
    expect(screen.queryByText("2017")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Previous year" }));
    expect(input).toHaveValue("11/04/2028");
    expect(screen.getByText("2017")).toBeInTheDocument();
  });

  describe("picking steps: day, month, year", () => {
    it("saves every pick and closes after the year, from an empty field", async () => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date(2026, 10, 5, 12));
      try {
        const { user } = renderWithProviders(<TestDatePicker initialValue={null} />);
        const input = screen.getByRole("textbox", { name: "Start date" });

        // Day: saved at once, then the month list opens
        await user.click(input);
        await user.click(screen.getByRole("gridcell", { name: /20 November 2026/ }));
        expect(input).toHaveValue("11/20/2026");
        expect(screen.getByRole("button", { name: "November" })).toHaveAttribute(
          "aria-pressed",
          "true",
        );

        // Month: saved with the same day, then the year list opens
        await user.click(screen.getByText("March"));
        expect(input).toHaveValue("03/20/2026");
        expect(screen.getByRole("button", { name: "2026" })).toHaveAttribute(
          "aria-pressed",
          "true",
        );

        // Year: saved, and the calendar closes
        await user.click(screen.getByText("2024"));
        expect(input).toHaveValue("03/20/2024");
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      } finally {
        vi.useRealTimers();
      }
    });

    it.each([
      ["month list", "November"],
      ["year list", "2026"],
    ])(
      "closes on a click in the input while the %s is open, then opens on the days",
      async (_name, button) => {
        const onValueChange = vi.fn();
        const { user } = renderWithProviders(<TestDatePicker onValueChange={onValueChange} />);
        const input = screen.getByRole("textbox", { name: "Start date" });

        await user.click(input);
        await user.click(screen.getByRole("button", { name: button }));
        await user.click(input);

        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(onValueChange).not.toHaveBeenCalled();

        await user.click(input);

        expect(screen.getByRole("gridcell", { name: /\b4 November 2026/ })).toBeInTheDocument();
      },
    );

    it("stays open on a click in the input while the days are shown", async () => {
      const { user } = renderWithProviders(<TestDatePicker />);
      const input = screen.getByRole("textbox", { name: "Start date" });

      await user.click(input);
      await user.click(input);

      expect(screen.getByRole("dialog", { name: "Choose a date" })).toBeInTheDocument();
    });

    it("starts on the days again when the calendar is opened the next time", async () => {
      const { user } = renderWithProviders(<TestDatePicker />);
      const input = screen.getByRole("textbox", { name: "Start date" });

      await user.click(input);
      await user.click(screen.getByRole("gridcell", { name: /20 November 2026/ }));
      await user.click(screen.getByText("March"));
      await user.click(screen.getByText("2024"));
      await user.click(input);

      expect(screen.getByRole("gridcell", { name: /\b4 March 2024/ })).toBeInTheDocument();
    });

    it("lets the month button start at the month step", async () => {
      const onValueChange = vi.fn();
      const { user } = renderWithProviders(<TestDatePicker onValueChange={onValueChange} />);
      const input = screen.getByRole("textbox", { name: "Start date" });

      await user.click(input);
      await user.click(screen.getByRole("button", { name: "November" }));
      await user.click(screen.getByText("March"));

      expect(input).toHaveValue("03/04/2026");
      await user.click(screen.getByText("2025"));
      expect(input).toHaveValue("03/04/2025");
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("lets the year button start at the year step, and closes after it", async () => {
      const onValueChange = vi.fn();
      const { user } = renderWithProviders(<TestDatePicker onValueChange={onValueChange} />);

      await user.click(screen.getByRole("textbox", { name: "Start date" }));
      await user.click(screen.getByRole("button", { name: "2026" }));
      await user.click(screen.getByText("2020"));

      expect(onValueChange).toHaveBeenCalledOnce();
      expect(onValueChange).toHaveBeenCalledWith(new Date(2020, 10, 4));
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("cuts the saved day when the picked month is shorter", async () => {
      const { user } = renderWithProviders(<TestDatePicker initialValue={new Date(2026, 0, 31)} />);
      const input = screen.getByRole("textbox", { name: "Start date" });

      await user.click(input);
      await user.click(screen.getByRole("button", { name: "January" }));
      await user.click(screen.getByText("February"));

      expect(input).toHaveValue("02/28/2026");
    });
  });

  it("can be used with the keyboard", async () => {
    const onValueChange = vi.fn();
    const { user } = renderWithProviders(<TestDatePicker onValueChange={onValueChange} />);

    // Tab only focuses the input: Tab must be able to pass over a date field
    await user.tab();
    expect(screen.getByRole("textbox", { name: "Start date" })).toHaveFocus();
    expect(screen.queryByRole("dialog", { name: "Choose a date" })).not.toBeInTheDocument();

    // Enter opens the calendar (and does not submit a form), with the focus on the 4th;
    // Down moves a week and Right a day: 4 → 11 → 12 November
    await user.keyboard("{Enter}");
    expect(screen.getByRole("dialog", { name: "Choose a date" })).toBeInTheDocument();
    expect(screen.getByRole("gridcell", { name: /\b4 November 2026/ })).toHaveFocus();
    await user.keyboard("{ArrowDown}{ArrowRight}{Enter}");

    // Enter picks the day, saves it and leads to the month step
    expect(onValueChange).toHaveBeenLastCalledWith(new Date(2026, 10, 12));
    expect(screen.getByRole("button", { name: "November" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    // The focus follows into the month list, on the saved month
    expect(screen.getByText("November", { selector: "[role=option]" })).toHaveFocus();
  });

  it("opens its calendar with an arrow key too, and Escape gives the focus back to the input", async () => {
    const { user } = renderWithProviders(<TestDatePicker />);
    const input = screen.getByRole("textbox", { name: "Start date" });

    await user.tab();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("gridcell", { name: /\b4 November 2026/ })).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Choose a date" })).not.toBeInTheDocument();
    expect(input).toHaveFocus();
  });

  it("takes a typed date", async () => {
    const onValueChange = vi.fn();
    const { user } = renderWithProviders(
      <TestDatePicker initialValue={null} onValueChange={onValueChange} />,
    );

    await user.type(screen.getByRole("textbox", { name: "Start date" }), "01/15/2027");

    expect(onValueChange).toHaveBeenLastCalledWith(new Date(2027, 0, 15));
  });

  it("takes a typed date while the year list is open", async () => {
    const onValueChange = vi.fn();
    const { user } = renderWithProviders(<TestDatePicker onValueChange={onValueChange} />);
    const input = screen.getByRole("textbox", { name: "Start date" });

    await user.click(input);
    await user.click(screen.getByRole("button", { name: "2026" }));
    await user.clear(input);
    await user.type(input, "01/15/2027");

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

  describe("as a start and end date pair", () => {
    it("does not let the end date be before the start date", async () => {
      const { user } = renderWithProviders(<TestDateRange />);

      await user.click(screen.getByRole("textbox", { name: "End date" }));
      const before = screen.getByRole("gridcell", { name: /Not available .*\b9 November 2026/ });
      await user.click(before);

      expect(before).toHaveAttribute("aria-disabled", "true");
      expect(screen.getByRole("textbox", { name: "End date" })).toHaveValue("");

      // The start day itself is allowed: a project can start and end on the same day.
      await user.click(screen.getByRole("gridcell", { name: /\b10 November 2026/ }));
      expect(screen.getByRole("textbox", { name: "End date" })).toHaveValue("11/10/2026");
    });

    it("does not let the start date be after the end date", async () => {
      const { user } = renderWithProviders(<TestDateRange />);

      await user.type(screen.getByRole("textbox", { name: "End date" }), "11/20/2026");
      await user.click(screen.getByRole("textbox", { name: "Start date" }));

      expect(
        screen.getByRole("gridcell", { name: /Not available .*\b21 November 2026/ }),
      ).toHaveAttribute("aria-disabled", "true");
      expect(screen.getByRole("gridcell", { name: /\b20 November 2026/ })).not.toHaveAttribute(
        "aria-disabled",
        "true",
      );
    });
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
