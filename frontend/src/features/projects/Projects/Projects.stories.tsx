import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent } from "storybook/test";
import { Projects } from "./Projects";
import {
  analytics,
  banking,
  blog,
  maxLengthProject,
  projectsErrorMock,
  projectsMock,
  sales,
  sampleProjects,
  variablesFor,
} from "./projects.mocks";

const desktop = { viewport: { value: "desktop", isRotated: false } };
const tablet = { viewport: { value: "tablet", isRotated: false } };

// A request that never answers, so the story stays in the loading state.
const NEVER = 2 ** 31 - 1;

// Checks shared by the desktop and the tablet story of the same data.
const expectListShown: Story["play"] = async ({ canvas }) => {
  await expect(await canvas.findByText("Blog")).toBeInTheDocument();
  await expect(canvas.getByText("05/31/2026")).toBeInTheDocument();
};

const expectLongestTextsShown: Story["play"] = async ({ canvas }) => {
  await expect(await canvas.findByText(maxLengthProject.description)).toBeInTheDocument();
  await expect(
    canvas.getByText("Amazon Web Services Elastic Container Service for Kubernetes"),
  ).toBeInTheDocument();
};

const meta = {
  title: "Features/Projects/Projects",
  component: Projects,
  // Full width, as the page fills the main area of the app.
  parameters: { layout: "fullscreen" },
  globals: desktop,
} satisfies Meta<typeof Projects>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The list on a 1440px desktop screen. */
export const Desktop: Story = {
  parameters: { apollo: { mocks: [projectsMock([blog, sales])] } },
  play: expectListShown,
};

/** The same list on a 768px tablet screen. */
export const Tablet: Story = {
  globals: tablet,
  parameters: { apollo: { mocks: [projectsMock([blog, sales])] } },
  play: expectListShown,
};

/** Four projects with descriptions of different lengths (from about 160 to 560 characters). */
export const ManyProjects: Story = {
  parameters: { apollo: { mocks: [projectsMock(sampleProjects)] } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Mobile Banking Platform")).toBeInTheDocument();
    await expect(canvas.getAllByRole("row")).toHaveLength(sampleProjects.length + 1);
  },
};

/** 35 projects make 4 pages of 10 rows: the page buttons show, and the first page is the current one. */
export const ManyPages: Story = {
  parameters: { apollo: { mocks: [projectsMock(sampleProjects, { total: 35 })] } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Mobile Banking Platform")).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Page 1" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(canvas.getByRole("button", { name: "Page 4" })).toBeInTheDocument();
  },
};

/** Search and sort go to the backend (each answer below is a mocked backend response). Typing and a click change the list. */
export const SearchAndSort: Story = {
  parameters: {
    apollo: {
      mocks: [
        projectsMock([blog, sales, analytics, banking]),
        projectsMock([banking], { variables: variablesFor({ search: "bank" }) }),
        projectsMock([banking], {
          variables: variablesFor({
            search: "bank",
            sort: { field: "startDate", direction: "ASC" },
          }),
        }),
      ],
    },
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Blog")).toBeInTheDocument();

    await userEvent.type(canvas.getByRole("searchbox", { name: "Search projects" }), "bank{Enter}");
    await expect(await canvas.findByText("Mobile Banking Platform")).toBeInTheDocument();
    await expect(canvas.queryByText("Blog")).not.toBeInTheDocument();

    await userEvent.click(canvas.getByRole("button", { name: "Start Date" }));
    await expect(canvas.getByRole("columnheader", { name: "Start Date" })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
    await expect(await canvas.findByText("Mobile Banking Platform")).toBeInTheDocument();
  },
};

/** A search that matches nothing: No projects found, and the search field keeps the text. */
export const NoResults: Story = {
  parameters: {
    apollo: {
      mocks: [
        projectsMock([blog, sales]),
        projectsMock([], { variables: variablesFor({ search: "zzz" }) }),
      ],
    },
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Blog")).toBeInTheDocument();
    await userEvent.type(canvas.getByRole("searchbox", { name: "Search projects" }), "zzz{Enter}");
    await expect(await canvas.findByText("No projects found")).toBeInTheDocument();
    await expect(canvas.getByRole("searchbox", { name: "Search projects" })).toHaveValue("zzz");
  },
};

/** A project with the longest texts the form allows: name 100, domain 100 and description 2000 characters. */
export const LongestTextsDesktop: Story = {
  parameters: { apollo: { mocks: [projectsMock([maxLengthProject, blog])] } },
  play: expectLongestTextsShown,
};

/** The same project on a 768px tablet screen: the text and the many tags must wrap inside the table. */
export const LongestTextsTablet: Story = {
  globals: tablet,
  parameters: { apollo: { mocks: [projectsMock([maxLengthProject, blog])] } },
  play: expectLongestTextsShown,
};

/** The table headers stay while the request runs. */
export const Loading: Story = {
  parameters: { apollo: { mocks: [{ ...projectsMock([]), delay: NEVER }] } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("status", { name: "Loading projects" })).toBeInTheDocument();
    await expect(canvas.getByRole("columnheader", { name: "Name" })).toBeInTheDocument();
  },
};

export const Empty: Story = {
  parameters: { apollo: { mocks: [projectsMock([])] } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("No projects found")).toBeInTheDocument();
  },
};

export const LoadFailed: Story = {
  parameters: { apollo: { mocks: [projectsErrorMock()] } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("alert")).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  },
};

/** The same list with Polish texts and dates (DD.MM.YYYY). */
export const Polish: Story = {
  globals: { ...desktop, locale: "pl" },
  parameters: { apollo: { mocks: [projectsMock([blog, sales])] } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("31.05.2026")).toBeInTheDocument();
    await expect(
      canvas.getByRole("columnheader", { name: "Data rozpoczęcia" }),
    ).toBeInTheDocument();
  },
};
