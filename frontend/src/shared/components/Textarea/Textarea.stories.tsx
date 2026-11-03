import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { Textarea } from "./Textarea";

// Colours as Chromium reports them (docs/design-tokens.md)
const RED = "rgb(198, 48, 49)";
const DARK_TEXT = "rgb(245, 245, 247)";

const SAMPLE =
  "Built the CV export service: PDF generation from the same data as the preview, with Cyrillic fonts.";

const meta = {
  title: "Form controls/Textarea",
  component: Textarea,
  args: { label: "Description" },
  // Figma's sample width; the top padding leaves room for the floated label.
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 400, paddingTop: "var(--space-4)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Textarea>;

export default meta;

type Story = StoryObj<typeof meta>;

// 120px high as drawn; the label rests at the top until focus, then moves above the border.
export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    const textarea = canvas.getByRole("textbox", { name: "Description" });
    await expect(textarea.parentElement).toHaveStyle({ height: "120px" });

    await userEvent.click(textarea);

    await expect(canvas.getByText("Description")).toHaveStyle({ fontSize: "12px" });
  },
};

// The value is 14px (Figma), smaller than the input's 16px.
export const Filled: Story = {
  args: { defaultValue: SAMPLE },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("textbox", { name: "Description" })).toHaveStyle({
      fontSize: "14px",
    });
  },
};

export const FilledDark: Story = {
  args: { defaultValue: SAMPLE },
  globals: { theme: "dark" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("textbox", { name: "Description" })).toHaveStyle({
      color: DARK_TEXT,
    });
  },
};

export const Invalid: Story = {
  args: { error: "Description is required" },
  play: async ({ canvas }) => {
    const textarea = canvas.getByRole("textbox", { name: "Description" });
    await expect(textarea.parentElement).toHaveStyle({ borderTopColor: RED });
  },
};

export const Disabled: Story = { args: { defaultValue: SAMPLE, disabled: true } };
