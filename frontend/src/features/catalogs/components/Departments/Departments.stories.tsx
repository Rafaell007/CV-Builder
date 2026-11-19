import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Departments } from "./Departments";
import {
  createDepartmentRefusedMock,
  deleteDepartmentRefusedMock,
  departmentsErrorMock,
  departmentsMock,
  engineering,
  fakeBackendMock,
  finance,
  manyDepartments,
  marketing,
} from "./departments.mocks";

const desktop = { viewport: { value: "desktop", isRotated: false } };
const tablet = { viewport: { value: "tablet", isRotated: false } };

// A request that never answers, so the story stays in the loading state.
const NEVER = 2 ** 31 - 1;

const sample = [engineering, finance, marketing];
const body = within(document.body);

const expectListShown: Story["play"] = async ({ canvas }) => {
  await expect(await canvas.findByText("Engineering")).toBeInTheDocument();
  await expect(canvas.getByRole("button", { name: "Actions for Marketing" })).toBeInTheDocument();
};

const meta = {
  title: "Features/Catalogs/Departments",
  component: Departments,
  // Full width, as the page fills the main area of the app.
  parameters: { layout: "fullscreen" },
  globals: desktop,
} satisfies Meta<typeof Departments>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The list on a 1440px desktop screen. */
export const Desktop: Story = {
  parameters: { apollo: { mocks: [fakeBackendMock(sample)] } },
  play: expectListShown,
};

/** The same list on a 768px tablet screen: the create button shows only its icon, with the full text as its name. */
export const Tablet: Story = {
  globals: tablet,
  parameters: { apollo: { mocks: [fakeBackendMock(sample)] } },
  play: async (context) => {
    await expectListShown(context);
    await expect(
      context.canvas.getByRole("button", { name: "CREATE DEPARTMENT" }),
    ).toBeInTheDocument();
  },
};

/** 25 departments make 3 pages of 10 rows; a click on a page asks the backend for it. */
export const ManyPages: Story = {
  parameters: { apollo: { mocks: [fakeBackendMock(manyDepartments(25))] } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Department 01")).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Page 3" }));
    // The last page holds the 5 departments that remain.
    await waitFor(() => expect(canvas.getAllByRole("row")).toHaveLength(6));
  },
};

/** Search and sort, answered by the stand-in backend (`fakeBackendMock`) as the real backend would. */
export const SearchAndSort: Story = {
  parameters: { apollo: { mocks: [fakeBackendMock(sample)] } },
  play: async ({ canvas }) => {
    const firstName = () => within(canvas.getAllByRole("row")[1]!).getAllByRole("cell")[0];
    await expect(await canvas.findByText("Engineering")).toBeInTheDocument();

    await userEvent.click(canvas.getByRole("button", { name: "Name" }));
    await waitFor(() => expect(firstName()).toHaveTextContent("Marketing"));

    await userEvent.type(
      canvas.getByRole("searchbox", { name: "Search departments" }),
      "FIN{Enter}",
    );
    // The backend returns only the match; the loading row shows in between.
    await expect(await canvas.findByText("Finance")).toBeInTheDocument();
    await waitFor(() => expect(canvas.queryByText("Engineering")).not.toBeInTheDocument());
  },
};

/** The table headers stay while the request runs. */
export const Loading: Story = {
  parameters: { apollo: { mocks: [{ ...departmentsMock([]), delay: NEVER }] } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("status", { name: "Loading departments" })).toBeInTheDocument();
    await expect(canvas.getByRole("columnheader", { name: "Name" })).toBeInTheDocument();
  },
};

export const Empty: Story = {
  parameters: { apollo: { mocks: [departmentsMock([])] } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("No departments found")).toBeInTheDocument();
  },
};

export const LoadFailed: Story = {
  parameters: { apollo: { mocks: [departmentsErrorMock()] } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("alert")).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  },
};

export const Polish: Story = {
  globals: { ...desktop, locale: "pl" },
  parameters: { apollo: { mocks: [fakeBackendMock(sample)] } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Engineering")).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "UTWÓRZ DZIAŁ" })).toBeInTheDocument();
  },
};

/** CREATE DEPARTMENT opens the empty modal; CREATE stays disabled until the name is filled. */
export const CreateDepartment: Story = {
  parameters: { apollo: { mocks: [fakeBackendMock(sample)] } },
  play: async ({ canvas }) => {
    await userEvent.click(await canvas.findByRole("button", { name: "CREATE DEPARTMENT" }));
    const dialog = await body.findByRole("dialog", { name: "Create department" });
    await expect(within(dialog).getByRole("button", { name: "Create" })).toBeDisabled();

    await userEvent.type(within(dialog).getByRole("textbox", { name: "Department" }), "Design");
    await expect(within(dialog).getByRole("button", { name: "Create" })).toBeEnabled();
  },
};

/** A name the backend already has: "Department already exists" under the field, and the name stays. */
export const CreateDepartmentNameTaken: Story = {
  parameters: {
    apollo: { mocks: [fakeBackendMock(sample), createDepartmentRefusedMock("engineering")] },
  },
  play: async ({ canvas }) => {
    await userEvent.click(await canvas.findByRole("button", { name: "CREATE DEPARTMENT" }));
    const dialog = await body.findByRole("dialog", { name: "Create department" });
    await userEvent.type(
      within(dialog).getByRole("textbox", { name: "Department" }),
      "engineering",
    );
    await userEvent.click(within(dialog).getByRole("button", { name: "Create" }));

    await expect(await within(dialog).findByText("Department already exists")).toBeInTheDocument();
  },
};

/** Edit opens the modal filled with the name of the row; UPDATE stays disabled until the name changes. */
export const UpdateDepartment: Story = {
  parameters: { apollo: { mocks: [fakeBackendMock(sample)] } },
  play: async ({ canvas }) => {
    await userEvent.click(await canvas.findByRole("button", { name: "Actions for Finance" }));
    await userEvent.click(await body.findByRole("menuitem", { name: "Edit" }));
    const dialog = await body.findByRole("dialog", { name: "Update department" });

    await expect(within(dialog).getByRole("textbox", { name: "Department" })).toHaveValue(
      "Finance",
    );
    await expect(within(dialog).getByRole("button", { name: "Update" })).toBeDisabled();
  },
};

/** Delete asks with the name in bold. */
export const DeleteDepartment: Story = {
  parameters: { apollo: { mocks: [fakeBackendMock(sample)] } },
  play: async ({ canvas }) => {
    await userEvent.click(await canvas.findByRole("button", { name: "Actions for Finance" }));
    await userEvent.click(await body.findByRole("menuitem", { name: "Delete" }));

    await expect(await body.findByRole("alertdialog")).toHaveTextContent(
      "Are you sure you want to delete department Finance?",
    );
  },
};

/** A department in use: the modal closes and an error toast tells why; the row stays. */
export const DeleteDepartmentInUse: Story = {
  parameters: {
    apollo: { mocks: [fakeBackendMock(sample), deleteDepartmentRefusedMock(finance.id)] },
  },
  play: async ({ canvas }) => {
    await userEvent.click(await canvas.findByRole("button", { name: "Actions for Finance" }));
    await userEvent.click(await body.findByRole("menuitem", { name: "Delete" }));
    const dialog = await body.findByRole("alertdialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Confirm" }));

    await expect(
      await body.findByText("Department cannot be deleted because it is currently in use"),
    ).toBeInTheDocument();
    await expect(canvas.getByText("Finance")).toBeInTheDocument();
  },
};
