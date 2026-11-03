import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";
import { Button, type ButtonVariant } from "./Button";

const VARIANTS: ButtonVariant[] = ["primary", "text", "secondary", "ghost"];

const meta = {
  title: "Form controls/Button",
  component: Button,
  args: { children: "Update", onClick: fn() },
  argTypes: {
    variant: { control: "inline-radio", options: VARIANTS },
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  play: async ({ canvas }) => {
    // --color-primary = #c63031 (docs/design-tokens.md)
    await expect(canvas.getByRole("button")).toHaveStyle({ backgroundColor: "rgb(198, 48, 49)" });
  },
};

export const Text: Story = { args: { variant: "text" } };

export const Secondary: Story = { args: { variant: "secondary" } };

export const SecondaryDark: Story = {
  args: { variant: "secondary" },
  globals: { theme: "dark" },
  play: async ({ canvas }) => {
    // Dark secondary fill = #454545
    await expect(canvas.getByRole("button")).toHaveStyle({ backgroundColor: "rgb(69, 69, 69)" });
  },
};

export const Ghost: Story = { args: { variant: "ghost", children: "Forgot password" } };

export const Disabled: Story = { args: { disabled: true } };

export const Loading: Story = {
  args: { loading: true },
  play: async ({ args, canvas, userEvent }) => {
    const button = canvas.getByRole("button", { name: "Update" });
    await userEvent.click(button);
    await expect(args.onClick).not.toHaveBeenCalled();
    await expect(button).toHaveAttribute("aria-busy", "true");
  },
};

export const AsLink: Story = {
  args: {
    variant: "ghost",
    asChild: true,
    children: <a href="#forgot-password">Forgot password</a>,
  },
};

// Every variant × state at once; switch the theme in the toolbar to compare light and dark.
// The grid ignores the story args (controls), so each button shows exactly its own variant and state.
export const AllVariants: Story = {
  render: () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, max-content)",
        gap: "var(--space-4)",
      }}
    >
      {VARIANTS.map((variant) => [
        <Button key={`${variant}-default`} variant={variant}>
          {variant}
        </Button>,
        <Button key={`${variant}-disabled`} variant={variant} disabled>
          {variant}
        </Button>,
        <Button key={`${variant}-loading`} variant={variant} loading>
          {variant}
        </Button>,
      ])}
    </div>
  ),
};
