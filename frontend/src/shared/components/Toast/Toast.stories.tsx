import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button } from "../Button";
import type { ToastVariant } from "./Toast.types";
import { useToast } from "./useToast";

const VARIANTS: readonly ToastVariant[] = ["success", "error", "warning", "info"];

// Placeholder texts; callers pass translated ones. withAppProviders (like the app layout) renders the ToastProvider.
function ToastDemo() {
  const toast = useToast();
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-4)" }}>
      {VARIANTS.map((variant) => (
        <Button
          key={variant}
          variant="secondary"
          onClick={() =>
            toast[variant]({ title: `Title ${variant}`, description: `Text ${variant}` })
          }
        >
          Show {variant}
        </Button>
      ))}
    </div>
  );
}

const meta = {
  title: "Shared/Toast",
  component: ToastDemo,
} satisfies Meta<typeof ToastDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

const body = within(document.body);

function toastArea() {
  return body.getByRole("region", { name: "Notifications (F8)" });
}

async function show(variant: ToastVariant) {
  await userEvent.click(body.getByRole("button", { name: `Show ${variant}` }));
  return within(toastArea()).findByText(`Title ${variant}`);
}

// Colours: docs/design-tokens.md › Notification; text from "Toast text contrast" (both themes alike)
async function expectColours(variant: ToastVariant, background: string, color: string) {
  const title = await show(variant);
  const toast = title.closest("li");
  await expect(toast).toHaveStyle({ backgroundColor: background, color });
}

export const Variants: Story = {
  play: async () => {
    await expectColours("success", "rgb(102, 187, 106)", "rgb(46, 46, 46)");
    await expectColours("error", "rgb(198, 48, 49)", "rgb(245, 245, 247)");
    await expectColours("warning", "rgb(255, 184, 0)", "rgb(46, 46, 46)");
  },
};

export const Dark: Story = {
  globals: { theme: "dark" },
  play: async () => {
    await expectColours("info", "rgb(41, 182, 246)", "rgb(46, 46, 46)");
    await expectColours("error", "rgb(198, 48, 49)", "rgb(245, 245, 247)");
  },
};

export const AtMostThree: Story = {
  play: async () => {
    for (const variant of VARIANTS) await show(variant);

    await waitFor(() => expect(within(toastArea()).getAllByRole("listitem")).toHaveLength(3));
    await expect(within(toastArea()).queryByText("Title success")).not.toBeInTheDocument();
  },
};

export const ClosesWithButton: Story = {
  play: async () => {
    const title = await show("info");
    const toast = title.closest("li");
    if (!toast) throw new Error("toast not found");

    await userEvent.click(within(toast).getByRole("button", { name: "Close notification" }));

    // Removed after the exit animation
    await waitFor(() => expect(toast).not.toBeInTheDocument());
  },
};
