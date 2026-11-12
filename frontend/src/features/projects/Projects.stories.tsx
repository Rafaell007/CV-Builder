import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Projects } from "./Projects";
import {
  blog,
  createProjectNetworkErrorMock,
  fakeBackendMock,
  manyProjects,
  maxLengthProject,
  projectsErrorMock,
  projectsMock,
  sales,
  sampleProjects,
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
  parameters: { apollo: { mocks: [fakeBackendMock([blog, sales])] } },
  play: expectListShown,
};

/** The same list on a 768px tablet screen. */
export const Tablet: Story = {
  globals: tablet,
  parameters: { apollo: { mocks: [fakeBackendMock([blog, sales])] } },
  play: expectListShown,
};

/** Four projects with descriptions of different lengths (from about 160 to 560 characters). */
export const ManyProjects: Story = {
  parameters: { apollo: { mocks: [fakeBackendMock(sampleProjects)] } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Mobile Banking Platform")).toBeInTheDocument();
    await expect(canvas.getAllByRole("row")).toHaveLength(sampleProjects.length + 1);
  },
};

/** 35 projects make 4 pages of 10 rows: the page buttons show, and a click on a page asks the backend for it. */
export const ManyPages: Story = {
  parameters: { apollo: { mocks: [fakeBackendMock(manyProjects(35))] } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Blog 01")).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Page 1" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(canvas.getByRole("button", { name: "Page 4" })).toBeInTheDocument();

    await userEvent.click(canvas.getByRole("button", { name: "Page 4" }));
    // The last page holds the 5 projects that remain (35 - 3 x 10).
    await waitFor(() => expect(canvas.getAllByRole("row")).toHaveLength(6));
    await expect(canvas.getByRole("button", { name: "Page 4" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  },
};

/** Search and sort work: every request is answered by the stand-in backend (`fakeBackendMock`), as the real backend would. */
export const SearchAndSort: Story = {
  parameters: { apollo: { mocks: [fakeBackendMock(sampleProjects)] } },
  play: async ({ canvas }) => {
    const search = canvas.getByRole("searchbox", { name: "Search projects" });
    const firstRow = () => canvas.getAllByRole("row")[1]!;
    await expect(await canvas.findByText("Blog")).toBeInTheDocument();
    // The list starts sorted by name ascending, and the Name header shows it.
    await expect(canvas.getByRole("columnheader", { name: "Name" })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );

    // Search: the backend returns only the matching project.
    await userEvent.type(search, "bank{Enter}");
    await expect(await canvas.findByText("Mobile Banking Platform")).toBeInTheDocument();
    await waitFor(() => expect(canvas.queryByText("Blog")).not.toBeInTheDocument());

    // An empty search returns every project again.
    await userEvent.clear(search);
    await userEvent.type(search, "{Enter}");
    await expect(await canvas.findByText("Blog")).toBeInTheDocument();

    // Sort: the first click sorts ascending (oldest start first), the second descending.
    await userEvent.click(canvas.getByRole("button", { name: "Start Date" }));
    await waitFor(() =>
      expect(within(firstRow()).getByText("Mobile Banking Platform")).toBeInTheDocument(),
    );
    await expect(canvas.getByRole("columnheader", { name: "Start Date" })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Start Date" }));
    await waitFor(() => expect(within(firstRow()).getByText("Blog")).toBeInTheDocument());
  },
};

/** A search that matches nothing: No projects found, and the search field keeps the text. */
export const NoResults: Story = {
  parameters: { apollo: { mocks: [fakeBackendMock([blog, sales])] } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Blog")).toBeInTheDocument();
    await userEvent.type(canvas.getByRole("searchbox", { name: "Search projects" }), "zzz{Enter}");
    await expect(await canvas.findByText("No projects found")).toBeInTheDocument();
    await expect(canvas.getByRole("searchbox", { name: "Search projects" })).toHaveValue("zzz");
  },
};

/** A project with the longest texts the form allows: name 100, domain 100 and description 2000 characters. */
export const LongestTextsDesktop: Story = {
  parameters: { apollo: { mocks: [fakeBackendMock([maxLengthProject, blog])] } },
  play: expectLongestTextsShown,
};

/** The same project on a 768px tablet screen: the text and the many tags must wrap inside the table. */
export const LongestTextsTablet: Story = {
  globals: tablet,
  parameters: { apollo: { mocks: [fakeBackendMock([maxLengthProject, blog])] } },
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
  parameters: { apollo: { mocks: [fakeBackendMock([blog, sales])] } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("31.05.2026")).toBeInTheDocument();
    await expect(
      canvas.getByRole("columnheader", { name: "Data rozpoczęcia" }),
    ).toBeInTheDocument();
  },
};

const body = within(document.body);

const newProject = {
  name: "Intranet",
  domain: "HR",
  startDate: "2026-01-10T00:00:00.000Z",
  endDate: "2026-06-30T00:00:00.000Z",
  description: "A portal for staff",
};

/** Types all five fields of the Create project modal. */
const fillCreateForm = async (dialog: HTMLElement) => {
  const form = within(dialog);
  await userEvent.type(form.getByRole("textbox", { name: "Name" }), newProject.name);
  await userEvent.type(form.getByRole("textbox", { name: "Domain" }), newProject.domain);
  await userEvent.type(form.getByRole("textbox", { name: "Start Date" }), "01/10/2026");
  await userEvent.type(form.getByRole("textbox", { name: "End Date" }), "06/30/2026");
  await userEvent.type(form.getByRole("textbox", { name: "Description" }), newProject.description);
};

/** CREATE PROJECT opens the empty modal; CREATE stays disabled until all five fields are valid. */
export const CreateProject: Story = {
  parameters: { apollo: { mocks: [fakeBackendMock([blog, sales])] } },
  play: async ({ canvas }) => {
    await userEvent.click(await canvas.findByRole("button", { name: "CREATE PROJECT" }));
    const dialog = await body.findByRole("dialog", { name: "Create project" });
    await expect(within(dialog).getByRole("button", { name: "Create" })).toBeDisabled();

    await fillCreateForm(dialog);
    await expect(within(dialog).getByRole("button", { name: "Create" })).toBeEnabled();
  },
};

/** The request fails: the modal stays open, the values stay and the message shows inside the modal. */
export const CreateProjectFailed: Story = {
  parameters: {
    apollo: {
      mocks: [fakeBackendMock([blog, sales]), createProjectNetworkErrorMock(newProject)],
    },
  },
  play: async ({ canvas }) => {
    await userEvent.click(await canvas.findByRole("button", { name: "CREATE PROJECT" }));
    const dialog = await body.findByRole("dialog", { name: "Create project" });
    await fillCreateForm(dialog);
    await userEvent.click(within(dialog).getByRole("button", { name: "Create" }));

    await expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "Something went wrong. Please try again later",
    );
    await expect(within(dialog).getByRole("textbox", { name: "Name" })).toHaveValue("Intranet");
  },
};
