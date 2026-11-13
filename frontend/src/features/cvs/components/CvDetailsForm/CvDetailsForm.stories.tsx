import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { backendCv } from "../../cvForm.mocks";
import { useCvDetailsForm } from "../../useCvDetailsForm";
import { CvDetailsForm } from "./CvDetailsForm";

// The page owns the hook; this small component gives the form the same input.
function Harness() {
  return <CvDetailsForm details={useCvDetailsForm(backendCv)} />;
}

const meta = {
  title: "Features/Cvs/CvDetailsForm",
  component: Harness,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Harness>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The fields hold the CV and UPDATE is disabled, because nothing changed. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("textbox", { name: "Name" })).toHaveValue("Backend CV");
    await expect(canvas.getByRole("button", { name: "UPDATE" })).toBeDisabled();
  },
};

/** A change enables UPDATE. */
export const Changed: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole("textbox", { name: "Name" }), " 2");
    await expect(canvas.getByRole("button", { name: "UPDATE" })).toBeEnabled();
  },
};

/** An empty required field shows its message and keeps UPDATE disabled. */
export const Invalid: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.clear(canvas.getByRole("textbox", { name: "Education" }));
    await userEvent.tab();
    await expect(await canvas.findByText("Education is required")).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "UPDATE" })).toBeDisabled();
  },
};

export const Polish: Story = {
  globals: { locale: "pl" },
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByRole("button", { name: "AKTUALIZUJ" }),
    ).toBeDisabled();
  },
};
