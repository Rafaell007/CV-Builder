import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { PasswordField } from "./PasswordField";

// Colours as Chromium reports them (docs/design-tokens.md)
const RED = "rgb(198, 48, 49)";
const DARK_ICON = "rgb(245, 245, 247)";

const meta = {
  title: "Form controls/PasswordField",
  component: PasswordField,
  args: {
    label: "Password",
    showPasswordLabel: "Show password",
    hidePasswordLabel: "Hide password",
  },
  // Figma's sample width; the top padding leaves room for the floated label.
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 400, paddingTop: "var(--space-4)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PasswordField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByLabelText("Password");
    await userEvent.type(input, "secret1");
    await expect(input).toHaveAttribute("type", "password");

    await userEvent.click(canvas.getByRole("button", { name: "Show password" }));

    await expect(input).toHaveAttribute("type", "text");
    await expect(canvas.getByRole("button", { name: "Hide password" })).toBeInTheDocument();
  },
};

export const Filled: Story = { args: { defaultValue: "secret1" } };

export const Dark: Story = {
  args: { defaultValue: "secret1" },
  globals: { theme: "dark" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Show password" })).toHaveStyle({
      color: DARK_ICON,
    });
  },
};

export const Invalid: Story = {
  args: { defaultValue: "secret", error: "Password is incorrect" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Show password" })).toHaveStyle({
      color: RED,
    });
  },
};

export const Disabled: Story = { args: { defaultValue: "secret1", disabled: true } };

// The eye button keeps the disabled grey, not the invalid red.
export const DisabledInvalid: Story = {
  args: { defaultValue: "secret1", disabled: true, error: "Password is incorrect" },
};
