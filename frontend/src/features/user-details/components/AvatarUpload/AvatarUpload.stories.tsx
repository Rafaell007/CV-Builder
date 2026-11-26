import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";
import { AvatarUpload } from "./AvatarUpload";

// Figma Design system › Avatar Uploader. On the page the Profile tab passes translated texts.
const meta = {
  title: "Features/UserDetails/AvatarUpload",
  component: AvatarUpload,
  args: {
    label: "Upload avatar image",
    hint: "png, jpg or gif no more than 5MB",
    onFileSelect: fn(),
  },
  parameters: { layout: "padded" },
} satisfies Meta<typeof AvatarUpload>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, args, userEvent }) => {
    const file = new File([new Uint8Array(10)], "photo.png", { type: "image/png" });
    await userEvent.upload(canvas.getByLabelText("Upload avatar image"), file);
    await expect(args.onFileSelect).toHaveBeenCalledWith(file);
  },
};

export const Dark: Story = { globals: { theme: "dark" } };

/** While an upload or a removal runs (prediction: Figma has no disabled state). */
export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText("Upload avatar image")).toBeDisabled();
  },
};

/** Figma 768: the hint starts left of the icon. */
export const Tablet: Story = {
  globals: { viewport: { value: "tablet", isRotated: false } },
};
