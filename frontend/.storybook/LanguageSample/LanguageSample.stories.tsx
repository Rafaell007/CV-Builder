import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { LanguageSample } from "./LanguageSample";

const meta = {
  title: "Setup/Language sample",
  component: LanguageSample,
} satisfies Meta<typeof LanguageSample>;

export default meta;

type Story = StoryObj<typeof meta>;

// `globals.locale` picks the toolbar language for the story; the texts come from the real messages.
export const English: Story = {
  globals: { locale: "en" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { name: "Employees" })).toBeInTheDocument();
    await expect(document.documentElement).toHaveAttribute("lang", "en");
  },
};

export const Polish: Story = {
  globals: { locale: "pl" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { name: "Pracownicy" })).toBeInTheDocument();
    await expect(document.documentElement).toHaveAttribute("lang", "pl");
  },
};
