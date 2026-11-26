import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor } from "storybook/test";
import {
  cvPreviewErrorMock,
  cvPreviewFigmaSample,
  cvPreviewForbiddenMock,
  cvPreviewMock,
  cvPreviewSample,
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

// The Desktop and Tablet stories use the content of the Figma frames (frame 41 and frame 32), to compare the layout.
const figmaMock = cvPreviewMock(cvPreviewFigmaSample);

/** The whole CV document on a desktop screen, with the content of the Figma desktop frame. */
export const Desktop: Story = {
  parameters: { apollo: { mocks: [figmaMock] } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Rostislav Harlanov")).toBeVisible();
    await expect(canvas.getByRole("table", { name: "Professional skills" })).toBeVisible();
    await expect(canvas.getByText("SaaS Media Platform")).toBeVisible();
  },
};

/** The same document on a 768px tablet screen, with the content of the Figma tablet frame. */
export const Tablet: Story = {
  globals: tablet,
  parameters: { apollo: { mocks: [figmaMock] } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Rostislav Harlanov")).toBeVisible();
  },
};

/** The short sample CV that the tests use: two skill groups, a skill without experience, a project without roles. */
export const ShortCv: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Anna Kowalska")).toBeVisible();
    await expect(canvas.getByText("Banking Portal")).toBeVisible();
  },
};

export const Loading: Story = {
  parameters: { apollo: { mocks: [{ ...cvPreviewMock(), delay: NEVER }] } },
  play: async ({ canvas }) => {
    const skeleton = await canvas.findByRole("status", { name: "Loading CV preview" });
    // The skeleton fades in, so it is not visible until the fade ends.
    await waitFor(() => expect(skeleton).toBeVisible());
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
  // The page asks in its own language, so the mock is for locale pl.
  parameters: { apollo: { mocks: [cvPreviewMock(undefined, "pl")] } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("table", { name: "Umiejętności zawodowe" })).toBeVisible();
  },
};

/** The gap that the name keeps to the EXPORT PDF button (`--space-4`). */
const EXPORT_GAP_PX = 16;

/**
 * A long name in Polish: the label `EKSPORTUJ PDF` is wider than `EXPORT PDF`, so the room that the header keeps free
 * must still leave the full gap between the name and the button (KAN-178). Measured in the real browser, after the
 * fonts load, because the button width comes from real text widths.
 */
export const PolishLongName: Story = {
  globals: { locale: "pl" },
  parameters: {
    apollo: {
      mocks: [
        cvPreviewMock(
          {
            ...cvPreviewSample,
            fullName: "Bartłomiej Konstantynopolitańczykiewicz-Wiśniewski Młodszy",
          },
          "pl",
        ),
      ],
    },
  },
  play: async ({ canvas }) => {
    const name = await canvas.findByRole("heading", { name: /Konstantynopolitańczykiewicz/ });
    const button = canvas.getByRole("button", { name: "EKSPORTUJ PDF" });
    await document.fonts.ready;

    const gap = button.getBoundingClientRect().left - name.getBoundingClientRect().right;
    await expect(gap).toBeGreaterThanOrEqual(EXPORT_GAP_PX);
  },
};
