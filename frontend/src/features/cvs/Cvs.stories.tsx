import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Cvs } from "./Cvs";
import {
  backendCv,
  cvsErrorMock,
  cvsMock,
  dataCv,
  fakeBackendMock,
  frontendCv,
  manyCvs,
  meMock,
  sampleCvs,
} from "./cvs.mocks";

const desktop = { viewport: { value: "desktop", isRotated: false } };
const tablet = { viewport: { value: "tablet", isRotated: false } };

// A request that never answers, so the story stays in the loading state.
const NEVER = 2 ** 31 - 1;

const expectListShown: Story["play"] = async ({ canvas }) => {
  await expect(await canvas.findByText("Frontend Developer")).toBeInTheDocument();
  // Anna owns two of the three CVs, so her email shows twice.
  await expect(canvas.getAllByText("anna.kowalska@example.com")).toHaveLength(2);
  await expect(canvas.getByText(frontendCv.description)).toBeInTheDocument();
};

const meta = {
  title: "Features/CVs/Cvs",
  component: Cvs,
  // Full width, as the page fills the main area of the app.
  parameters: { layout: "fullscreen" },
  globals: desktop,
} satisfies Meta<typeof Cvs>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The list on a 1440px desktop screen. */
export const Desktop: Story = {
  parameters: { apollo: { mocks: [fakeBackendMock(sampleCvs)] } },
  play: expectListShown,
};

/** The same list on a 768px tablet screen: the Employee column is hidden, as in Figma. */
export const Tablet: Story = {
  globals: tablet,
  parameters: { apollo: { mocks: [fakeBackendMock(sampleCvs)] } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Frontend Developer")).toBeInTheDocument();
    await expect(canvas.getByText(frontendCv.description)).toBeInTheDocument();
    await expect(canvas.queryByRole("columnheader", { name: /Employee/ })).toBeNull();
    await expect(canvas.queryByText("anna.kowalska@example.com")).toBeNull();
  },
};

/** 35 CVs make 4 pages of 10 rows: the page buttons show, and a click on a page asks the backend for it. */
export const ManyPages: Story = {
  parameters: { apollo: { mocks: [fakeBackendMock(manyCvs(35))] } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Backend Engineer 02")).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Page 1" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await userEvent.click(canvas.getByRole("button", { name: "Page 4" }));
    // The last page holds the 5 CVs that remain (35 - 3 x 10); each CV has a row and a detail line.
    await waitFor(() => expect(canvas.getAllByRole("row")).toHaveLength(11));
    await expect(canvas.getByRole("button", { name: "Page 4" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  },
};

/** Search (name or owner email) and sort work: the stand-in backend answers every request, as the real backend would. */
export const SearchAndSort: Story = {
  parameters: { apollo: { mocks: [fakeBackendMock(sampleCvs)] } },
  play: async ({ canvas }) => {
    const search = canvas.getByRole("searchbox", { name: "Search CVs" });
    const firstRow = () => canvas.getAllByRole("row")[1]!;
    await expect(await canvas.findByText("Frontend Developer")).toBeInTheDocument();
    // The list starts sorted by name ascending, and the Name header shows it.
    await expect(canvas.getByRole("columnheader", { name: "Name" })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
    await waitFor(() => expect(within(firstRow()).getByText("Backend Engineer")).toBeVisible());

    // Search by the email of the owner.
    await userEvent.type(search, "jan.nowak{Enter}");
    await waitFor(() => expect(canvas.queryByText("Frontend Developer")).not.toBeInTheDocument());
    await expect(await canvas.findByText("Backend Engineer")).toBeInTheDocument();

    // An empty search returns every CV again.
    await userEvent.clear(search);
    await userEvent.type(search, "{Enter}");
    await expect(await canvas.findByText("Frontend Developer")).toBeInTheDocument();

    // Sort: a click on Name switches to descending.
    await userEvent.click(canvas.getByRole("button", { name: "Name" }));
    await waitFor(() => expect(within(firstRow()).getByText("Frontend Developer")).toBeVisible());
  },
};

/** A search that matches nothing: No CVs found, and the search field keeps the text. */
export const NoResults: Story = {
  parameters: { apollo: { mocks: [fakeBackendMock([frontendCv, backendCv])] } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Frontend Developer")).toBeInTheDocument();
    await userEvent.type(canvas.getByRole("searchbox", { name: "Search CVs" }), "zzz{Enter}");
    await expect(await canvas.findByText("No CVs found")).toBeInTheDocument();
    await expect(canvas.getByRole("searchbox", { name: "Search CVs" })).toHaveValue("zzz");
  },
};

/** The CVs of one user (the User CVs tab): the stand-in backend keeps the CVs of that user. */
export const OfOneUser: Story = {
  args: { userId: "10" },
  parameters: { apollo: { mocks: [fakeBackendMock([frontendCv, backendCv, dataCv])] } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Data Analyst")).toBeInTheDocument();
    await expect(canvas.queryByText("Backend Engineer")).not.toBeInTheDocument();
  },
};

/** The table headers stay while the request runs. */
export const Loading: Story = {
  parameters: { apollo: { mocks: [{ ...cvsMock([]), delay: NEVER }] } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("status", { name: "Loading CVs" })).toBeInTheDocument();
    await expect(canvas.getByRole("columnheader", { name: "Name" })).toBeInTheDocument();
  },
};

/** A signed-in user without CVs. */
export const Empty: Story = {
  parameters: { apollo: { mocks: [meMock("USER"), cvsMock([])] } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("You have no CVs yet")).toBeInTheDocument();
  },
};

/** An admin sees No CVs found for an empty list, not the text for a user without CVs. */
export const EmptyAdmin: Story = {
  parameters: { apollo: { mocks: [meMock("ADMIN"), cvsMock([])] } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("No CVs found")).toBeInTheDocument();
  },
};

export const LoadFailed: Story = {
  parameters: { apollo: { mocks: [cvsErrorMock()] } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("alert")).toHaveTextContent("Failed to load CVs");
    await expect(canvas.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  },
};

/** The same list with Polish texts. */
export const Polish: Story = {
  globals: { ...desktop, locale: "pl" },
  parameters: { apollo: { mocks: [fakeBackendMock(sampleCvs)] } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Frontend Developer")).toBeInTheDocument();
    await expect(canvas.getByRole("columnheader", { name: "Wykształcenie" })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "UTWÓRZ CV" })).toBeInTheDocument();
  },
};
