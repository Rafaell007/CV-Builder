import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";
import { Pagination } from "../Pagination";
import { DataTable } from "./DataTable";
import { queryMockUsers, type MockUser } from "./DataTable.mocks";
import type { DataTableColumn, SortState } from "./DataTable.types";

const columns: DataTableColumn<MockUser>[] = [
  { id: "firstName", header: "First name", sortField: "firstName", cell: (u) => u.firstName },
  { id: "lastName", header: "Last name", sortField: "lastName", cell: (u) => u.lastName },
  { id: "email", header: "Email", cell: (u) => u.email },
  { id: "department", header: "Department", sortField: "department", cell: (u) => u.department },
  { id: "position", header: "Position", sortField: "position", cell: (u) => u.position },
];

const meta = {
  title: "Shared/DataTable",
  component: DataTable<MockUser>,
  args: {
    label: "Employees",
    columns,
    rows: [],
    getRowId: (user) => user.id,
  },
} satisfies Meta<typeof DataTable<MockUser>>;

export default meta;

type Story = StoryObj<typeof meta>;

const firstPage = queryMockUsers({ page: 1 }).items.slice(0, 4);

/**
 * The sample from the ticket: a fake backend (`search, sort, page → { items, total }`) behind the table.
 * Sorting and searching go back to page 1, as the users page does.
 */
function SampleList() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortState | undefined>();
  const [page, setPage] = useState(1);
  const [opened, setOpened] = useState<string>();
  const { items, total } = queryMockUsers({ search, sort, page });

  return (
    <div>
      <input
        type="search"
        aria-label="Search"
        placeholder="Search"
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          setPage(1);
        }}
      />
      <DataTable
        label="Employees"
        columns={columns}
        rows={items}
        getRowId={(user) => user.id}
        sort={sort}
        onSortChange={(next) => {
          setSort(next);
          setPage(1);
        }}
        onRowClick={(user) => setOpened(`${user.firstName} ${user.lastName}`)}
        renderRowActions={(user) => (
          <button type="button" aria-label={`Actions for ${user.firstName} ${user.lastName}`}>
            ⋮
          </button>
        )}
        emptyContent="No users found"
      />
      <Pagination page={page} total={total} onPageChange={setPage} />
      <p>{opened ? `Opened: ${opened}` : "Click a row to open it."}</p>
    </div>
  );
}

export const Sample: Story = {
  render: () => <SampleList />,
  play: async ({ canvas }) => {
    // Sorting: the first click sorts ascending, the second descending.
    await userEvent.click(canvas.getByRole("button", { name: "Last name" }));
    await expect(canvas.getByRole("columnheader", { name: "Last name" })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
    const firstRow = () => canvas.getAllByRole("row")[1]!;
    await expect(within(firstRow()).getByText("Hamilton")).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Last name" }));
    await expect(within(firstRow()).getByText("Turing")).toBeInTheDocument();

    // Paging: 35 users make 4 pages of 10 rows.
    await expect(canvas.getAllByRole("row")).toHaveLength(11);
    await userEvent.click(canvas.getByRole("button", { name: "Page 4" }));
    await expect(canvas.getAllByRole("row")).toHaveLength(6);

    // Searching returns to page 1.
    await userEvent.type(canvas.getByRole("searchbox", { name: "Search" }), "zzz");
    await expect(canvas.getByText("No users found")).toBeInTheDocument();

    await userEvent.clear(canvas.getByRole("searchbox", { name: "Search" }));
    await expect(canvas.getByRole("button", { name: "Page 1" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    // Row actions and row click are separate.
    await userEvent.click(canvas.getAllByRole("button", { name: /^Actions for/ })[0]!);
    await expect(canvas.getByText("Click a row to open it.")).toBeInTheDocument();
    await userEvent.click(firstRow());
    await expect(canvas.getByText(/^Opened:/)).toBeInTheDocument();
  },
};

export const Selectable: Story = {
  args: {
    rows: firstPage,
    selectable: true,
    selectedIds: [firstPage[0]!.id],
    onSelectionChange: fn(),
  },
  play: async ({ canvas, args }) => {
    await expect(canvas.getByRole("checkbox", { name: "Select all rows" })).toHaveAttribute(
      "aria-checked",
      "mixed",
    );
    await userEvent.click(canvas.getByRole("checkbox", { name: "Select all rows" }));
    await expect(args.onSelectionChange).toHaveBeenCalledWith(firstPage.map((user) => user.id));
  },
};

export const Loading: Story = {
  args: { loading: true, loadingContent: "Loading users…" },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Loading users…")).toBeInTheDocument();
    await expect(canvas.getByRole("columnheader", { name: "First name" })).toBeInTheDocument();
  },
};

export const Empty: Story = {
  args: { emptyContent: "No users found" },
};

export const HiddenColumnAndDetailLine: Story = {
  args: {
    rows: firstPage,
    columns: columns.map((column) =>
      column.id === "email" ? { ...column, hideBelow: 100000 } : column,
    ),
    renderRowDetail: (user) => <p>{`${user.firstName} works as ${user.position}.`}</p>,
  },
  play: async ({ canvas }) => {
    // hideBelow 100000 is above any window width, so the Email column is always hidden.
    await expect(canvas.queryByRole("columnheader", { name: "Email" })).not.toBeInTheDocument();
    await expect(canvas.getByRole("columnheader", { name: "Position" })).toBeInTheDocument();
    await expect(
      canvas.getByText(`${firstPage[0]!.firstName} works as ${firstPage[0]!.position}.`),
    ).toBeInTheDocument();
  },
};
