import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, fn } from "storybook/test";
import { DatePicker, type DatePickerProps } from "./DatePicker";

// Colours as Chromium reports them (docs/design-tokens.md › Date picker)
const RED = "rgb(198, 48, 49)";
const GREY_100 = "rgb(245, 245, 247)";
const GREY_400 = "rgb(174, 174, 174)";
const GREY_500 = "rgb(98, 98, 98)";

const LABELS = {
  calendar: "Choose a date",
  previousMonth: "Previous month",
  nextMonth: "Next month",
  previousYears: "Previous years",
  nextYears: "Next years",
  chooseDayPrefix: "Choose",
  unavailableDayPrefix: "Not available",
  monthPrefix: "Month",
};

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
    await userEvent.click(canvas.getByText("Mar"));
    await expect(canvas.getByRole("button", { name: "March" })).toBeInTheDocument();
  },
};

export const YearList: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("textbox", { name: "Start date" }));
    await userEvent.click(canvas.getByRole("button", { name: "2026" }));
    await expect(canvas.getByRole("button", { name: "Next years" })).toBeInTheDocument();
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

export const Invalid: Story = {
  args: { value: null, error: "Enter a start date" },
  play: async ({ canvas }) => {
    const input = canvas.getByRole("textbox", { name: "Start date" });
    await expect(input.closest("div[class*='control']")).toHaveStyle({ borderTopColor: RED });
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("textbox", { name: "Start date" })).toBeDisabled();
  },
};
