import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { DeviceErrorGate } from "./DeviceErrorGate";

// The two widths around the 768px breakpoint. https://storybook.js.org/docs/essentials/viewport
const VIEWPORTS = {
  width767: { name: "767px", styles: { width: "767px", height: "1024px" }, type: "tablet" },
  width768: { name: "768px", styles: { width: "768px", height: "1024px" }, type: "tablet" },
};

const meta = {
  title: "Features/DeviceErrorGate",
  component: DeviceErrorGate,
  parameters: { layout: "fullscreen", viewport: { options: VIEWPORTS } },
  args: { children: <p>Page content</p> },
} satisfies Meta<typeof DeviceErrorGate>;

export default meta;

type Story = StoryObj<typeof meta>;

// Below 768px the gate replaces the page.
export const Width767: Story = {
  globals: { viewport: { value: "width767", isRotated: false } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { level: 1, name: "Oops" })).toBeVisible();
    await expect(canvas.getByText("Page content")).not.toBeVisible();
  },
};

// From 768px the page shows and the gate is hidden.
export const Width768: Story = {
  globals: { viewport: { value: "width768", isRotated: false } },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Page content")).toBeVisible();
    await expect(canvas.queryByRole("heading", { name: "Oops" })).not.toBeInTheDocument();
  },
};
