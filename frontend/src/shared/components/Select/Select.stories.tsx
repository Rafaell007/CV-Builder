import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, fn, screen } from "storybook/test";
import { Select, type SelectProps } from "./Select";

// Colours as Chromium reports them (docs/design-tokens.md › Select)
const RED = "rgb(198, 48, 49)";
const GREY_400 = "rgb(174, 174, 174)";
const GREY_500 = "rgb(98, 98, 98)";
const GREY_300 = "rgb(196, 196, 198)";
const GREY_600 = "rgb(69, 69, 69)";
const GREY_100 = "rgb(245, 245, 247)";

const POSITIONS = [
  { value: "frontend", label: "Frontend developer" },
  { value: "backend", label: "Backend developer" },
  { value: "qa", label: "QA engineer" },
  { value: "designer", label: "Designer" },
  { value: "pm", label: "Project manager" },
  { value: "ba", label: "Business analyst" },
  { value: "devops", label: "DevOps engineer" },
];

// While the list is open, Radix hides the rest of the page from screen readers (modal list), and the story's
// accessibility check would flag the hidden trigger. Stories that open the list close it again at the end.
async function closeList(userEvent: { keyboard: (text: string) => Promise<void> }) {
  await userEvent.keyboard("{Escape}");
}

// Select is controlled: the story holds the value, as a form does.
function StatefulSelect(args: SelectProps) {
  const [value, setValue] = useState(args.value);
  return (
    <Select
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
  title: "Form controls/Select",
  component: Select,
  args: { label: "Position", options: POSITIONS, value: "", onValueChange: fn(), onBlur: fn() },
  render: (args) => <StatefulSelect {...args} />,
  // Figma's sample width; the top padding leaves room for the floated label.
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 400, paddingTop: "var(--space-4)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Select>;

export default meta;

type Story = StoryObj<typeof meta>;

// The label rests inside until a value is chosen.
export const Default: Story = {
  play: async ({ canvas }) => {
    const select = canvas.getByRole("combobox", { name: "Position" });
    await expect(canvas.getByText("Position")).toHaveStyle({ fontSize: "16px" });
    // The border is on Field's box, the trigger's parent.
    await expect(select.parentElement).toHaveStyle({ borderTopColor: GREY_400 });
  },
};

export const DefaultDark: Story = {
  globals: { theme: "dark" },
  play: async ({ canvas }) => {
    const select = canvas.getByRole("combobox", { name: "Position" });
    await expect(select.parentElement).toHaveStyle({ borderTopColor: GREY_500 });
  },
};

// The list opens under the field, at the field's width; 5 options show, the rest scroll.
export const Open: Story = {
  play: async ({ canvas, userEvent, args }) => {
    const select = canvas.getByRole("combobox", { name: "Position" });
    await userEvent.click(select);

    const list = await screen.findByRole("listbox");
    const field = select.parentElement!.getBoundingClientRect();
    const listBox = list.parentElement!.getBoundingClientRect();
    await expect(Math.round(listBox.width)).toBe(Math.round(field.width));
    await expect(Math.round(listBox.top)).toBe(Math.round(field.bottom));
    await expect(Math.round(listBox.height)).toBe(5 * 47 + 1);
    await expect(screen.getByRole("option", { name: "Designer" })).toHaveStyle({ height: "47px" });
    await expect(canvas.getByText("Position")).toHaveStyle({ fontSize: "12px" });

    await userEvent.click(screen.getByRole("option", { name: "QA engineer" }));
    await expect(args.onValueChange).toHaveBeenCalledWith("qa");
  },
};

export const OpenDark: Story = {
  globals: { theme: "dark" },
  play: async ({ canvas, userEvent }) => {
    const select = canvas.getByRole("combobox", { name: "Position" });
    await userEvent.click(select);
    await screen.findByRole("listbox");
    await expect(select.parentElement).toHaveStyle({ backgroundColor: GREY_600 });
    await closeList(userEvent);
  },
};

// The selected option is drawn dark (light theme) when the list opens again.
export const Filled: Story = {
  args: { value: "backend" },
  play: async ({ canvas, userEvent }) => {
    const select = canvas.getByRole("combobox", { name: "Position" });
    await expect(canvas.getByText("Position")).toHaveStyle({ fontSize: "12px", color: GREY_500 });
    await expect(select.parentElement).toHaveStyle({ borderTopColor: GREY_500 });

    await userEvent.click(select);
    const selected = await screen.findByRole("option", { name: "Backend developer" });
    await expect(selected).toHaveStyle({ backgroundColor: GREY_500, color: GREY_100 });
    await closeList(userEvent);
  },
};

export const FilledDark: Story = {
  args: { value: "backend" },
  globals: { theme: "dark" },
  play: async ({ canvas }) => {
    const select = canvas.getByRole("combobox", { name: "Position" });
    await expect(canvas.getByText("Position")).toHaveStyle({ color: GREY_100 });
    await expect(select.parentElement).toHaveStyle({ backgroundColor: GREY_600 });
  },
};

export const WithHelperText: Story = {
  args: { helperText: "Shown on the CV" },
};

export const Invalid: Story = {
  args: { error: "Choose a position" },
  play: async ({ canvas }) => {
    const select = canvas.getByRole("combobox", { name: "Position" });
    await expect(select.parentElement).toHaveStyle({ borderTopColor: RED });
    await expect(select.querySelector("svg")).toHaveStyle({ color: RED });
  },
};

export const Disabled: Story = {
  args: { value: "frontend", disabled: true },
  play: async ({ canvas }) => {
    const select = canvas.getByRole("combobox", { name: "Position" });
    await expect(select).toBeDisabled();
    await expect(select).toHaveStyle({ color: GREY_400, fontSize: "16px" });
  },
};

// Another employee's profile (Figma frame 20): drawn as disabled, focusable, the list never opens.
export const ReadOnly: Story = {
  args: { value: "frontend", readOnly: true },
  // Figma's grey (about 1.2:1) is below WCAG 4.5:1; kept by the user's choice (docs/design-tokens.md). Warning only.
  parameters: { a11y: { test: "todo" } },
  play: async ({ canvas, userEvent, args }) => {
    const select = canvas.getByRole("combobox", { name: "Position" });
    await expect(select).toHaveStyle({ color: GREY_400 });
    await expect(select.parentElement).toHaveStyle({ backgroundColor: GREY_300 });
    await expect(canvas.getByText("Position")).toHaveStyle({ color: GREY_500 });
    await expect(select.querySelector("svg")).toHaveStyle({ color: GREY_400 });

    await userEvent.tab();
    await userEvent.keyboard("{Enter}");

    await expect(select).toHaveFocus();
    await expect(select.parentElement).toHaveStyle({ borderTopColor: GREY_500 });
    await expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    await expect(args.onValueChange).not.toHaveBeenCalled();
  },
};

export const ReadOnlyDark: Story = {
  args: { value: "frontend", readOnly: true },
  parameters: { a11y: { test: "todo" } },
  globals: { theme: "dark" },
  play: async ({ canvas }) => {
    const select = canvas.getByRole("combobox", { name: "Position" });
    await expect(select).toHaveStyle({ color: GREY_400 });
    await expect(select.parentElement).toHaveStyle({ backgroundColor: GREY_500 });
  },
};
