import type { MockLink } from "@apollo/client/testing";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { CvProjects } from "./CvProjects";
import { catalogProject, CV_ID, cvProject, cvProjectsMock } from "./cvProjects.mocks";

const desktop = { viewport: { value: "desktop", isRotated: false } };
const tablet = { viewport: { value: "tablet", isRotated: false } };

/** A mock that answers every request, so a story can be replayed. */
const always = (mock: MockLink.MockedResponse): MockLink.MockedResponse => ({
  ...mock,
  maxUsageCount: Number.POSITIVE_INFINITY,
});

// The two projects of the Figma frame (1440 › CV Projects), so the page can be compared with it.
const figmaProjects = [
  cvProject({
    id: "link-1",
    startDate: "2023-08-21T00:00:00.000Z",
    endDate: null,
    responsibilities: "Managed to write code in time",
    project: catalogProject({
      id: "project-1",
      name: "SaaS Media Platform",
      domain: "IoT (Internet of Things)",
      description:
        "A digital music, podcast, and video service that gives you access to millions of songs and other content from creators all over the world. The user can connect and manage service providers such as Spotify, Apple Music, Tidal and SoundCloud in a few clicks and play content from them.",
    }),
  }),
  cvProject({
    id: "link-2",
    startDate: "2023-01-20T00:00:00.000Z",
    endDate: "2023-06-19T00:00:00.000Z",
    responsibilities: "Did something great\nDid not break production",
    project: catalogProject({
      id: "project-2",
      name: "Business Process Automation",
      domain: "Automation",
      description:
        "A system for setting up business process automation. Includes work with webhooks, queries to third-party services and databases, mailing of letters, sms notifications and much more. The user can set up a scheme of interconnected processes and run them one after the other. Each type of work can be run synchronously or asynchronously. There is also support for error handling and re-execution attempts.",
    }),
  }),
];

const meta = {
  title: "Features/Cvs/CvProjects",
  component: CvProjects,
  args: { cvId: CV_ID },
  // Full width, as the tab fills the main area of the CV page.
  parameters: {
    layout: "fullscreen",
    apollo: { mocks: [always(cvProjectsMock(figmaProjects))] },
  },
  globals: desktop,
} satisfies Meta<typeof CvProjects>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The projects of a CV on a 1440px desktop screen: the description and the responsibility tags under each row. */
export const Desktop: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("cell", { name: "SaaS Media Platform" })).toBeVisible();
    await expect(canvas.getByText("Managed to write code in time")).toBeVisible();
    await expect(canvas.getByText("Did not break production")).toBeVisible();
    await expect(canvas.getByRole("button", { name: "ADD PROJECT" })).toBeEnabled();
  },
};

/** The same page on a 768px tablet screen: no Domain column, the description is cut after three lines. */
export const Tablet: Story = {
  globals: tablet,
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("cell", { name: "SaaS Media Platform" })).toBeVisible();
  },
};
