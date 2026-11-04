import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, fn } from "storybook/test";
import { MultiSelect, type MultiSelectProps } from "./MultiSelect";

// Colours as Chromium reports them (docs/design-tokens.md › Multi-select, Select)
const RED = "rgb(198, 48, 49)";
const GREY_100 = "rgb(245, 245, 247)";
const GREY_400 = "rgb(174, 174, 174)";
const GREY_500 = "rgb(98, 98, 98)";
const GREY_600 = "rgb(69, 69, 69)";
const GREY_700 = "rgb(46, 46, 46)";

const SKILLS = [
  { value: "react", label: "React" },
  { value: "next", label: "Next.js" },
  { value: "nest", label: "NestJS" },
  { value: "graphql", label: "GraphQL" },
  { value: "pg", label: "PostgreSQL" },
  { value: "docker", label: "Docker" },
  { value: "playwright", label: "Playwright" },
];

// The chip elements, found through their text (chips have no role of their own)
function chips(canvas: { getByText: (text: string) => HTMLElement }) {
  return [canvas.getByText("React").parentElement, canvas.getByText("PostgreSQL").parentElement];
}

// MultiSelect is controlled: the story holds the value, as a form does.
function StatefulMultiSelect(args: MultiSelectProps) {
  const [value, setValue] = useState(args.value);
  return (
    <MultiSelect
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
  title: "Form controls/MultiSelect",
  component: MultiSelect,
  args: {
    label: "Skills",
    options: SKILLS,
    value: [],
    onValueChange: fn(),
    onBlur: fn(),
    getRemoveLabel: (option: string) => `Remove ${option}`,
  },
  render: (args) => <StatefulMultiSelect {...args} />,
  // Figma's sample width; the top padding leaves room for the floated label, the bottom for the open list.
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 400, padding: "var(--space-4) 0 260px" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MultiSelect>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    const combobox = canvas.getByRole("combobox", { name: "Skills" });
    await expect(canvas.getByText("Skills")).toHaveStyle({ fontSize: "16px" });
    await expect(combobox.closest("[data-filled], div[class*='control']")).toHaveStyle({
      height: "48px",
    });
  },
};

// Rows have checkboxes; picking one adds a chip and keeps the list open.
export const Open: Story = {
  play: async ({ canvas, userEvent, args }) => {
    const combobox = canvas.getByRole("combobox", { name: "Skills" });
    await userEvent.click(combobox);

    const list = canvas.getByRole("listbox", { name: "Skills" });
    const field = list.parentElement!.parentElement!.getBoundingClientRect();
    const listBox = list.getBoundingClientRect();
    await expect(Math.round(listBox.width)).toBe(Math.round(field.width));
    await expect(Math.round(listBox.top)).toBe(Math.round(field.bottom));
    await expect(Math.round(listBox.height)).toBe(5 * 47 + 1);

    const option = canvas.getByRole("option", { name: "NestJS" });
    await expect(option).toHaveStyle({ height: "47px" });
    await userEvent.click(option);
    await expect(args.onValueChange).toHaveBeenCalledWith(["nest"]);
    await expect(option).toHaveStyle({ backgroundColor: GREY_500, color: GREY_100 });
    await expect(combobox).toHaveAttribute("aria-expanded", "true");
  },
};

export const OpenDark: Story = {
  args: { value: ["nest"] },
  globals: { theme: "dark" },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("combobox", { name: "Skills" }));
    await expect(canvas.getByRole("option", { name: "NestJS" })).toHaveStyle({
      backgroundColor: GREY_100,
      color: GREY_700,
    });
  },
};

// Chips: 24px high, 12px from the field's top-left, 13px apart.
export const Filled: Story = {
  args: { value: ["react", "pg"] },
  play: async ({ canvas }) => {
    const [first, second] = chips(canvas);
    const field = first!.closest("[data-filled]")!.getBoundingClientRect();
    const firstBox = first!.getBoundingClientRect();
    await expect(firstBox.height).toBe(24);
    await expect(firstBox.left - field.left).toBe(12);
    await expect(firstBox.top - field.top).toBe(12);
    await expect(second!.getBoundingClientRect().left - firstBox.right).toBe(13);
    await expect(first).toHaveStyle({ borderTopColor: GREY_700, color: GREY_700 });
    await expect(canvas.getByText("Skills")).toHaveStyle({ fontSize: "12px" });
  },
};

export const FilledDark: Story = {
  args: { value: ["react", "pg"] },
  globals: { theme: "dark" },
  play: async ({ canvas }) => {
    const [first] = chips(canvas);
    await expect(first).toHaveStyle({ borderTopColor: GREY_400 });
    await expect(first!.closest("[data-filled]")).toHaveStyle({ backgroundColor: GREY_600 });
  },
};

// Prediction: many chips wrap and the field grows.
export const ManyChips: Story = {
  args: { value: SKILLS.map((skill) => skill.value) },
};

export const Invalid: Story = {
  args: { error: "Choose at least one skill" },
  play: async ({ canvas }) => {
    const combobox = canvas.getByRole("combobox", { name: "Skills" });
    await expect(combobox.parentElement!.parentElement).toHaveStyle({ borderTopColor: RED });
    await expect(combobox.querySelector("svg")).toHaveStyle({ color: RED });
  },
};

export const Disabled: Story = {
  args: { value: ["react", "pg"], disabled: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("React")).toHaveStyle({ color: GREY_400 });
    await expect(canvas.queryByRole("button", { name: /Remove/ })).not.toBeInTheDocument();
  },
};
