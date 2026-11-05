import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, fn } from "storybook/test";
import { DatePicker, type DatePickerProps } from "./DatePicker";
import { DATE_PICKER_EXAMPLE_LABELS as LABELS } from "./datePicker.fixtures";

// Colours as Chromium reports them (docs/design-tokens.md › Date picker)
const RED = "rgb(198, 48, 49)";
const GREY_100 = "rgb(245, 245, 247)";
const GREY_400 = "rgb(174, 174, 174)";
const GREY_500 = "rgb(98, 98, 98)";

// DatePicker is controlled: the story holds the value, as a form does.
function StatefulDatePicker(args: DatePickerProps) {
  const [value, setValue] = useState(args.value);
  return (
    <DatePicker
      {...args}
      value={value}
      onValueChange={(next) => {
        setValue(next);
        args.onValueChange(next);
      }}
    />
  );
}

const meta = {
  title: "Form controls/DatePicker",
  component: DatePicker,
  args: {
    label: "Start date",
    value: new Date(2026, 10, 4),
    locale: "en",
    labels: LABELS,
    onValueChange: fn(),
    onBlur: fn(),
  },
  render: (args) => <StatefulDatePicker {...args} />,
  // Figma's sample width; room above for the floated label and below for the 449px calendar.
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 400, padding: "var(--space-4) 0 380px" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DatePicker>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: { value: null },
  play: async ({ canvas }) => {
    const input = canvas.getByRole("textbox", { name: "Start date" });
    await expect(canvas.getByText("Start date")).toHaveStyle({ fontSize: "16px" });
    await expect(input.closest("div[class*='control']")).toHaveStyle({
      borderTopColor: GREY_400,
    });
  },
};

// The calendar: 449px wide, under the field's bottom border, aligned with its outer left edge.
export const Open: Story = {
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole("textbox", { name: "Start date" });
    await userEvent.click(input);

    const calendar = canvas.getByRole("dialog", { name: "Choose a date" });
    const field = input.closest("div[class*='control']")!.getBoundingClientRect();
    const box = calendar.getBoundingClientRect();
    await expect(box.width).toBe(449);
    await expect(Math.round(box.top)).toBe(Math.round(field.bottom));
    await expect(Math.round(box.left)).toBe(Math.round(field.left));

    const selected = canvas.getByRole("gridcell", { name: /\b4 November 2026/ });
    await expect(selected).toHaveStyle({
      width: "41px",
      height: "41px",
      backgroundColor: RED,
      color: GREY_100,
    });
    await expect(canvas.getByRole("button", { name: "Next month" })).toHaveStyle({
      width: "40px",
      borderTopColor: GREY_500,
    });
  },
};

export const OpenDark: Story = {
  globals: { theme: "dark" },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("textbox", { name: "Start date" }));
    await expect(canvas.getByRole("dialog", { name: "Choose a date" })).toHaveStyle({
      boxShadow: "none",
    });
    await expect(canvas.getByRole("button", { name: "Next month" })).toHaveStyle({
      borderTopColor: GREY_100,
    });
  },
};

// The month button opens the months of the shown year; picking one shows its days.
export const MonthList: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("textbox", { name: "Start date" }));
    await userEvent.click(canvas.getByRole("button", { name: "November" }));
    await expect(canvas.getByRole("button", { name: "November" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await userEvent.click(canvas.getByText("March"));
    await expect(canvas.getByRole("button", { name: "March" })).toBeInTheDocument();
  },
};

export const YearList: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("textbox", { name: "Start date" }));
    await userEvent.click(canvas.getByRole("button", { name: "2026" }));
    await expect(canvas.getByRole("button", { name: "Next year" })).toBeInTheDocument();
  },
};

export const Polish: Story = {
  args: { locale: "pl", label: "Data rozpoczęcia" },
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole("textbox", { name: "Data rozpoczęcia" });
    await expect(input).toHaveValue("04.11.2026");
    await userEvent.click(input);
    await expect(canvas.getByRole("button", { name: "listopad" })).toBeInTheDocument();
  },
};

export const WithMinDate: Story = {
  args: { minDate: new Date(2026, 10, 3) },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("textbox", { name: "Start date" }));
    await expect(
      canvas.getByRole("gridcell", { name: /Not available .*\b2 November 2026/ }),
    ).toHaveStyle({ textDecorationLine: "line-through" });
  },
};

// Two linked fields, as the project forms use them: the end date's minDate is the start date.
function DateRangeDemo() {
  const [start, setStart] = useState<Date | null>(new Date(2026, 10, 10));
  const [end, setEnd] = useState<Date | null>(null);
  return (
    <div style={{ display: "grid", gap: "var(--space-8)" }}>
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
    </div>
  );
}

// Start 10 November 2026: the end date's calendar crosses out the days before it.
export const StartAndEndDate: Story = {
  render: () => <DateRangeDemo />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("textbox", { name: "End date" }));
    await expect(
      canvas.getByRole("gridcell", { name: /Not available .*\b9 November 2026/ }),
    ).toHaveStyle({ textDecorationLine: "line-through" });
    await userEvent.click(canvas.getByRole("gridcell", { name: /\b20 November 2026/ }));

    // With an end date, the start date's calendar crosses out the days after it.
    await userEvent.click(canvas.getByRole("textbox", { name: "Start date" }));
    await expect(
      canvas.getByRole("gridcell", { name: /Not available .*\b21 November 2026/ }),
    ).toHaveStyle({ textDecorationLine: "line-through" });
  },
};

export const Invalid: Story = {
  args: { value: null, error: "Enter a start date" },
  play: async ({ canvas }) => {
    const input = canvas.getByRole("textbox", { name: "Start date" });
    await expect(input.closest("div[class*='control']")).toHaveStyle({ borderTopColor: RED });
  },
};

// Dark theme: the error text and the open-list header use the lighter error red (#E9B0B0, 7:1), not #C63031 (2.5:1)
const ERROR_TEXT_DARK = "rgb(233, 176, 176)";

// The error state with the calendar open: the field stays invalid and the icon stays red.
export const InvalidOpen: Story = {
  args: { value: null, error: "Enter a start date" },
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole("textbox", { name: "Start date" });
    await userEvent.click(input);

    await expect(canvas.getByRole("dialog", { name: "Choose a date" })).toBeInTheDocument();
    await expect(input).toBeInvalid();
    await expect(input).toHaveAccessibleDescription("Enter a start date");
    await expect(input.closest("div[class*='control']")).toHaveStyle({ borderTopColor: RED });
  },
};

export const InvalidDark: Story = {
  globals: { theme: "dark" },
  args: { value: null, error: "Enter a start date" },
  play: async ({ canvas }) => {
    const input = canvas.getByRole("textbox", { name: "Start date" });
    await expect(input).toBeInvalid();
    await expect(input.closest("div[class*='control']")).toHaveStyle({ borderTopColor: RED });
    await expect(canvas.getByText("Enter a start date")).toHaveStyle({ color: ERROR_TEXT_DARK });
  },
};

export const InvalidOpenDark: Story = {
  globals: { theme: "dark" },
  args: { value: null, error: "Enter a start date" },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("textbox", { name: "Start date" }));

    await expect(canvas.getByRole("dialog", { name: "Choose a date" })).toBeInTheDocument();
    await expect(canvas.getByRole("textbox", { name: "Start date" })).toBeInvalid();
  },
};

export const EmptyDark: Story = {
  globals: { theme: "dark" },
  args: { value: null },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("textbox", { name: "Start date" })).toHaveValue("");
    await expect(canvas.getByText("Start date")).toHaveStyle({ fontSize: "16px" });
  },
};

// Dark month list: the open header button is the light error red, the selected month a red rectangle.
export const MonthListDark: Story = {
  globals: { theme: "dark" },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("textbox", { name: "Start date" }));
    await userEvent.click(canvas.getByRole("button", { name: "November" }));

    await expect(canvas.getByRole("button", { name: "November" })).toHaveStyle({
      color: ERROR_TEXT_DARK,
    });
    await expect(canvas.getByText("January")).toBeInTheDocument();
    const selected = canvas.getAllByText("November").at(-1)!.closest("[aria-selected='true']");
    await expect(selected).toHaveStyle({ backgroundColor: RED, color: GREY_100 });
  },
};

export const YearListDark: Story = {
  globals: { theme: "dark" },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("textbox", { name: "Start date" }));
    await userEvent.click(canvas.getByRole("button", { name: "2026" }));

    await expect(canvas.getByRole("button", { name: "2026" })).toHaveStyle({
      color: ERROR_TEXT_DARK,
    });
    await expect(canvas.getByRole("button", { name: "Next year" })).toBeInTheDocument();
    const selected = canvas.getAllByText("2026").at(-1)!.closest("[class*='year-text--selected']");
    await expect(selected).toHaveStyle({ backgroundColor: RED, color: GREY_100 });
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("textbox", { name: "Start date" })).toBeDisabled();
  },
};
