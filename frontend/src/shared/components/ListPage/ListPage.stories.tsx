import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";
import { DataTable, type DataTableColumn } from "../DataTable";
import { PageHeader } from "../PageHeader";
import { PageState } from "../PageState";
import { Pagination } from "../Pagination";
import { SearchField } from "../SearchField";
import { ListPage } from "./ListPage";

interface Row {
  id: string;
  name: string;
}

const rows: Row[] = ["Engineering", "Finance", "Human Resources", "Marketing", "Sales"].map(
  (name, index) => ({ id: String(index + 1), name }),
);
const columns: DataTableColumn<Row>[] = [{ id: "name", header: "Name", cell: (row) => row.name }];
const stateLabels = {
  loading: "Loading departments",
  empty: "No departments found",
  noResults: "No departments found",
  error: "Something went wrong. Please try again later",
  retry: "Retry",
};

const meta = {
  title: "Shared/ListPage",
  component: ListPage,
  // Full width, as the page fills the main area of the app.
  parameters: { layout: "fullscreen" },
  globals: { viewport: { value: "desktop", isRotated: false } },
  // The route renders the PageHeader above the ListPage; the story does the same, so the whole page shows.
  decorators: [
    (Story) => (
      <>
        <PageHeader
          title="Departments"
          breadcrumbs={[{ label: "Departments" }]}
          breadcrumbsLabel="Breadcrumbs"
        />
        <Story />
      </>
    ),
  ],
  args: {
    search: <SearchField label="Search" placeholder="Search" onSearch={fn()} />,
    createLabel: "Create department",
    onCreate: fn(),
    pagination: (
      <Pagination
        page={1}
        total={35}
        onPageChange={fn()}
        labels={{
          navigation: "Pagination",
          previous: "Previous page",
          next: "Next page",
          page: (number) => `Page ${number}`,
        }}
      />
    ),
    children: (
      <DataTable
        label="Departments list"
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
      />
    ),
  },
} satisfies Meta<typeof ListPage>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 1440px: the create button shows the plus icon and its text. */
export const Desktop: Story = {
  play: async ({ canvas, args }) => {
    await canvas.getByRole("button", { name: "Create department" }).click();
    await expect(args.onCreate).toHaveBeenCalledOnce();
  },
};

/** 768px: the create button is the plus icon only; its text stays the accessible name. */
export const Tablet: Story = {
  globals: { viewport: { value: "tablet", isRotated: false } },
  play: async ({ canvas }) => {
    const button = canvas.getByRole("button", { name: "Create department" });
    await expect(button.getBoundingClientRect().width).toBe(58);
  },
};

/** The list could not be loaded: the error replaces the list and the page buttons; the toolbar stays. */
export const LoadFailed: Story = {
  args: { error: <PageState kind="error" labels={stateLabels} onRetry={fn()} /> },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    await expect(canvas.queryByRole("table")).not.toBeInTheDocument();
  },
};
