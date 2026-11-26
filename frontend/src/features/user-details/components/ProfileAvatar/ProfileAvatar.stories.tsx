import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";
import { AVATAR_PHOTO_MOCK } from "../../user-details.mocks";
import { ProfileAvatar } from "./ProfileAvatar";

// Figma Design system › Avatar Uploader ("With image", "Remove image"). On the page the Profile tab passes the
// translated name of the Remove button.
const meta = {
  title: "Features/UserDetails/ProfileAvatar",
  component: ProfileAvatar,
  args: {
    name: "Emma Employee",
    src: AVATAR_PHOTO_MOCK,
    removeLabel: "Remove avatar",
    onRemove: fn(),
  },
  parameters: { layout: "padded" },
} satisfies Meta<typeof ProfileAvatar>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The × shows on hover or keyboard focus (always on touch screens). */
export const WithRemove: Story = {
  play: async ({ canvas, args, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Remove avatar" }));
    await expect(args.onRemove).toHaveBeenCalledOnce();
  },
};

export const Dark: Story = { globals: { theme: "dark" } };

/** While an upload or a removal runs (prediction: Figma has no disabled state). */
export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Remove avatar" })).toBeDisabled();
  },
};

/** No photo: the initials, no Remove button. */
export const Initials: Story = {
  // Rendered without `onRemove`: the parent leaves it out when there is no photo.
  render: (args) => <ProfileAvatar name={args.name} src={null} removeLabel={args.removeLabel} />,
  play: async ({ canvas }) => {
    await expect(canvas.getByText("EE")).toBeInTheDocument();
    await expect(canvas.queryByRole("button", { name: "Remove avatar" })).not.toBeInTheDocument();
  },
};
