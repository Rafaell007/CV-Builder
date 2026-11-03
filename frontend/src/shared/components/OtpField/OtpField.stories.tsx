import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect } from "storybook/test";
import { OtpField, type OtpFieldProps } from "./OtpField";

// The field is controlled, so every story needs a small wrapper that keeps the value.
function Controlled(props: OtpFieldProps) {
  const [value, setValue] = useState(props.value);
  return <OtpField {...props} value={value} onValueChange={setValue} />;
}

const meta = {
  title: "Form controls/OtpField",
  component: OtpField,
  render: (args) => <Controlled {...args} />,
  args: {
    label: "Verification code",
    getDigitLabel: (position, length) => `Digit ${position} of ${length}`,
    value: "",
    onValueChange: () => undefined,
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 400 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof OtpField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("textbox", { name: "Digit 1 of 6" }));
    await userEvent.keyboard("123");

    await expect(canvas.getByRole("textbox", { name: "Digit 3 of 6" })).toHaveValue("3");
    await expect(canvas.getByRole("textbox", { name: "Digit 4 of 6" })).toHaveFocus();
  },
};

export const Filled: Story = { args: { value: "123456" } };

export const Dark: Story = { args: { value: "123456" }, globals: { theme: "dark" } };

export const Invalid: Story = {
  args: { value: "123456", error: "Invalid verification code" },
};

export const Disabled: Story = { args: { value: "123456", disabled: true } };
