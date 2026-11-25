import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { TextField } from "./TextField";

// Colours as Chromium reports them (docs/design-tokens.md)
const RED = "rgb(198, 48, 49)";
const LIGHT_TEXT = "rgb(46, 46, 46)";
const DARK_TEXT = "rgb(245, 245, 247)";
const GREY_300 = "rgb(196, 196, 198)";
const GREY_400 = "rgb(174, 174, 174)";
const GREY_500 = "rgb(98, 98, 98)";

const meta = {
  title: "Form controls/TextField",
  component: TextField,
  args: { label: "Email" },
  // Figma's sample width; the top padding leaves room for the floated label.
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 400, paddingTop: "var(--space-4)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TextField>;

export default meta;

type Story = StoryObj<typeof meta>;

// The label sits inside until the field gets focus, then moves above the border.
export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    const label = canvas.getByText("Email");
    await expect(label).toHaveStyle({ fontSize: "16px" });

    await userEvent.click(canvas.getByRole("textbox", { name: "Email" }));

    await expect(label).toHaveStyle({ fontSize: "12px" });
  },
};

// A value keeps the label above the border without focus.
export const Filled: Story = {
  args: { defaultValue: "ann@example.com" },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Email")).toHaveStyle({ fontSize: "12px" });
    await expect(canvas.getByRole("textbox", { name: "Email" })).toHaveStyle({ color: LIGHT_TEXT });
  },
};

export const FilledDark: Story = {
  args: { defaultValue: "ann@example.com" },
  globals: { theme: "dark" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("textbox", { name: "Email" })).toHaveStyle({ color: DARK_TEXT });
  },
};

export const WithHelperText: Story = {
  args: { helperText: "We use it to sign you in" },
};

export const Invalid: Story = {
  args: { defaultValue: "ann@", error: "Enter a valid email" },
  play: async ({ canvas }) => {
    const input = canvas.getByRole("textbox", { name: "Email" });
    // The border is on Field's box, the input's parent.
    await expect(input.parentElement).toHaveStyle({ borderTopColor: RED });
    await expect(canvas.getByText("Enter a valid email")).toHaveStyle({ color: RED });
  },
};

export const InvalidEmpty: Story = {
  args: { error: "Email is required" },
};

export const Disabled: Story = {
  args: { defaultValue: "John", disabled: true },
};

// Another employee's profile (Figma frame 20): drawn as disabled, but focusable with the focus border.
export const ReadOnly: Story = {
  args: { label: "First name", defaultValue: "John", readOnly: true },
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole("textbox", { name: "First name" });
    await expect(input).toHaveStyle({ color: GREY_400 });
    await expect(input.parentElement).toHaveStyle({ backgroundColor: GREY_300 });
    await expect(canvas.getByText("First name")).toHaveStyle({ color: GREY_500 });

    await userEvent.tab();

    await expect(input).toHaveFocus();
    await expect(input.parentElement).toHaveStyle({ borderTopColor: GREY_500 });
  },
};

export const ReadOnlyDark: Story = {
  args: { label: "First name", defaultValue: "John", readOnly: true },
  globals: { theme: "dark" },
  play: async ({ canvas }) => {
    const input = canvas.getByRole("textbox", { name: "First name" });
    await expect(input).toHaveStyle({ color: GREY_400 });
    await expect(input.parentElement).toHaveStyle({ backgroundColor: GREY_500 });
  },
};
