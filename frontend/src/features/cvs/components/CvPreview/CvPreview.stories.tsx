import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import {
  cvPreviewErrorMock,
  cvPreviewForbiddenMock,
  cvPreviewMock,
} from "../../useCvPreview/cvPreview.mocks";
import { CvPreview } from "./CvPreview";

const CV_ID = "cv-1";
const desktop = { viewport: { value: "desktop", isRotated: false } };
const tablet = { viewport: { value: "tablet", isRotated: false } };

// A request that never answers, so the story stays in the loading state.
const NEVER = 2 ** 31 - 1;

const meta = {
  title: "Features/Cvs/CvPreview",
  component: CvPreview,
  args: { cvId: CV_ID },
  // Full width, as the tab fills the main area of the CV page.
  parameters: { layout: "fullscreen", apollo: { mocks: [cvPreviewMock()] } },
  globals: desktop,
} satisfies Meta<typeof CvPreview>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The whole CV document on a desktop screen. */
export const Desktop: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Anna Kowalska")).toBeVisible();
    await expect(canvas.getByRole("table", { name: "Professional skills" })).toBeVisible();
    await expect(canvas.getByText("Banking Portal")).toBeVisible();
  },
};

/** The same document on a 768px tablet screen. */
export const Tablet: Story = {
  globals: tablet,
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Anna Kowalska")).toBeVisible();
  },
};

export const Loading: Story = {
  parameters: { apollo: { mocks: [{ ...cvPreviewMock(), delay: NEVER }] } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("status", { name: "Loading CV preview" })).toBeVisible();
  },
};

export const LoadFailed: Story = {
  parameters: { apollo: { mocks: [cvPreviewErrorMock(CV_ID)] } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Failed to load CV preview")).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Retry" })).toBeVisible();
  },
};

export const Unauthorized: Story = {
  parameters: { apollo: { mocks: [cvPreviewForbiddenMock(CV_ID)] } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("You are not authorized to access this CV")).toBeVisible();
    await expect(canvas.queryByText("Anna Kowalska")).not.toBeInTheDocument();
  },
};

export const Polish: Story = {
  globals: { locale: "pl" },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("table", { name: "Umiejętności zawodowe" })).toBeVisible();
  },
};
