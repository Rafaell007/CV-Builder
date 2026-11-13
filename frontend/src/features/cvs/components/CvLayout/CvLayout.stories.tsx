import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { backendCv } from "../../cvForm.mocks";
import { cvCodeErrorMock, cvMock, cvNetworkErrorMock } from "../../useCv/cv.mocks";
import { CvLayout } from "./CvLayout";

const meta = {
  title: "Features/Cvs/CvLayout",
  component: CvLayout,
  args: { cvId: backendCv.id, children: <p>Tab page</p> },
  parameters: {
    layout: "fullscreen",
    nextjs: { navigation: { pathname: "/en/cvs/1/details" } },
  },
} satisfies Meta<typeof CvLayout>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The breadcrumbs, the four tabs and the tab page. */
export const Ready: Story = {
  parameters: { apollo: { mocks: [cvMock(backendCv)] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText("Tab page")).toBeInTheDocument();
    await expect(canvas.getByText("Backend CV")).toBeInTheDocument();
    await expect(canvas.getByRole("link", { name: "Preview" })).toBeInTheDocument();
  },
};

/** The CV loads: the skeleton shows and the tab page does not. */
export const Loading: Story = {
  parameters: { apollo: { mocks: [{ ...cvMock(backendCv), delay: 600000 }] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole("status", { name: "Loading CV" })).toBeInTheDocument();
    await expect(canvas.queryByText("Tab page")).not.toBeInTheDocument();
  },
};

/** The CV does not exist, or belongs to another user: the same screen for both. */
export const NotFound: Story = {
  parameters: { apollo: { mocks: [cvCodeErrorMock(backendCv.id, "NOT_FOUND")] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole("alert")).toHaveTextContent("CV not found");
    await expect(canvas.queryByText("Tab page")).not.toBeInTheDocument();
  },
};

export const Forbidden: Story = {
  parameters: { apollo: { mocks: [cvCodeErrorMock(backendCv.id, "FORBIDDEN")] } },
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("alert")).toHaveTextContent("No access");
  },
};

/** A network or server error: the message with Retry. */
export const LoadFailed: Story = {
  parameters: { apollo: { mocks: [cvNetworkErrorMock(backendCv.id)] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText("Failed to load CV details")).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  },
};

export const Polish: Story = {
  globals: { locale: "pl" },
  parameters: { apollo: { mocks: [cvMock(backendCv)] } },
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByRole("link", { name: "Szczegóły" }),
    ).toBeInTheDocument();
  },
};
