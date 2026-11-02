import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, type within } from "storybook/test";
import { ThemeSample } from "./ThemeSample";

// --color-bg per theme: --palette-grey-100 (#f5f5f7) and --palette-grey-700 (#2e2e2e) in tokens.css.
const LIGHT_BG = "rgb(245, 245, 247)";
const DARK_BG = "rgb(46, 46, 46)";

const meta = {
  title: "Setup/Theme sample",
  component: ThemeSample,
} satisfies Meta<typeof ThemeSample>;

export default meta;

type Story = StoryObj<typeof meta>;

// The card is the heading's parent; its background is --color-bg, so it shows which theme themes.css applied.
const getCard = (canvas: ReturnType<typeof within>) =>
  canvas.getByRole("heading", { name: "CV Builder" }).parentElement;

// `globals.theme` picks the toolbar theme for the story.
export const Light: Story = {
  globals: { theme: "light" },
  play: async ({ canvas }) => {
    await expect(document.documentElement).toHaveAttribute("data-theme", "light");
    await expect(getCard(canvas)).toHaveStyle({ backgroundColor: LIGHT_BG });
  },
};

export const Dark: Story = {
  globals: { theme: "dark" },
  play: async ({ canvas }) => {
    await expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    await expect(getCard(canvas)).toHaveStyle({ backgroundColor: DARK_BG });
  },
};

// No attribute: themes.css follows the browser's prefers-color-scheme.
export const System: Story = {
  globals: { theme: "system" },
  play: async ({ canvas }) => {
    await expect(document.documentElement).not.toHaveAttribute("data-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    await expect(getCard(canvas)).toHaveStyle({
      backgroundColor: prefersDark ? DARK_BG : LIGHT_BG,
    });
  },
};
