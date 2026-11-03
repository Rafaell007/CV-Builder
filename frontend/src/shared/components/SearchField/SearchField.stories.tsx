import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, waitFor } from "storybook/test";
import { SearchField } from "./SearchField";

const meta = {
  title: "Form controls/SearchField",
  component: SearchField,
  args: { label: "Search employees", placeholder: "Search", onSearch: fn() },
  // Figma's width in the USERS header.
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 320 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SearchField>;

export default meta;

type Story = StoryObj<typeof meta>;

// Type in the Canvas and watch the Actions panel: onSearch fires once you stop typing.
export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const input = canvas.getByRole("searchbox", { name: "Search employees" });
    await expect(input).toHaveStyle({ height: "40px" });

    await userEvent.type(input, "ann");

    await waitFor(() => expect(args.onSearch).toHaveBeenCalledWith("ann"));
    await expect(args.onSearch).toHaveBeenCalledTimes(1);
  },
};

export const WithValue: Story = { args: { defaultValue: "Ann" } };

export const Dark: Story = { globals: { theme: "dark" } };

export const Disabled: Story = { args: { disabled: true } };
