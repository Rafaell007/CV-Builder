import { act } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen, within } from "@/shared/testing";
import { DataTable, type DataTableProps } from "./DataTable";
import type { DataTableColumn } from "./DataTable.types";

interface Person {
  id: string;
  firstName: string;
  position: string;
}

const people: Person[] = [
  { id: "1", firstName: "Ada", position: "Engineer" },
  { id: "2", firstName: "Grace", position: "Admiral" },
];

const columns: DataTableColumn<Person>[] = [
  { id: "firstName", header: "First name", cell: (row) => row.firstName, sortField: "firstName" },
  { id: "position", header: "Position", cell: (row) => row.position },
];

function renderTable(props: Partial<DataTableProps<Person>> = {}) {
  return renderWithProviders(
    <DataTable
      label="People"
      columns={columns}
      rows={people}
      getRowId={(row) => row.id}
      onSortChange={vi.fn()}
      {...props}
    />,
  );
}

describe("DataTable", () => {
  it("renders the headers and the cells of every row", () => {
    renderTable();

    expect(screen.getByRole("columnheader", { name: "First name" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Position" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Ada" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Admiral" })).toBeInTheDocument();
  });

  describe("sorting", () => {
    it("shows a sort button only for columns with a sort field", () => {
      renderTable();

      expect(screen.getByRole("button", { name: "First name" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Position" })).not.toBeInTheDocument();
    });

    it("asks for ascending order on the first click", async () => {
      const onSortChange = vi.fn();
      const { user } = renderTable({ onSortChange });

      await user.click(screen.getByRole("button", { name: "First name" }));

      expect(onSortChange).toHaveBeenCalledWith({ field: "firstName", direction: "ASC" });
    });

    it("asks for descending order, then for ascending order again", async () => {
      const onSortChange = vi.fn();
      const { user, rerender } = renderTable({
        onSortChange,
        sort: { field: "firstName", direction: "ASC" },
      });
      await user.click(screen.getByRole("button", { name: "First name" }));
      expect(onSortChange).toHaveBeenLastCalledWith({ field: "firstName", direction: "DESC" });

      rerender(
        <DataTable
          label="People"
          columns={columns}
          rows={people}
          getRowId={(row) => row.id}
          onSortChange={onSortChange}
          sort={{ field: "firstName", direction: "DESC" }}
        />,
      );
      await user.click(screen.getByRole("button", { name: "First name" }));
      expect(onSortChange).toHaveBeenLastCalledWith({ field: "firstName", direction: "ASC" });
    });

    it("marks the sorted column for assistive technology", () => {
      renderTable({ sort: { field: "firstName", direction: "DESC" } });

      expect(screen.getByRole("columnheader", { name: "First name" })).toHaveAttribute(
        "aria-sort",
        "descending",
      );
    });

    it("turns the arrow down only for the column sorted in descending order", () => {
      const sortableColumns: DataTableColumn<Person>[] = [
        {
          id: "firstName",
          header: "First name",
          cell: (row) => row.firstName,
          sortField: "firstName",
        },
        { id: "position", header: "Position", cell: (row) => row.position, sortField: "position" },
      ];
      renderTable({
        columns: sortableColumns,
        sort: { field: "firstName", direction: "DESC" },
      });

      const arrowOf = (name: string) => screen.getByRole("button", { name }).querySelector("svg");
      expect(arrowOf("First name")).toHaveAttribute("data-direction", "descending");
      expect(arrowOf("Position")).not.toHaveAttribute("data-direction");
    });
  });

  describe("row click", () => {
    it("calls onRowClick with the row on click and on Enter", async () => {
      const onRowClick = vi.fn();
      const { user } = renderTable({ onRowClick });

      await user.click(screen.getByRole("cell", { name: "Ada" }));
      expect(onRowClick).toHaveBeenLastCalledWith(people[0]);

      const row = screen.getByRole("cell", { name: "Grace" }).closest("tr");
      row?.focus();
      await user.keyboard("{Enter}");
      expect(onRowClick).toHaveBeenLastCalledWith(people[1]);
    });

    it("does not make rows focusable without onRowClick", () => {
      renderTable();

      expect(screen.getByRole("cell", { name: "Ada" }).closest("tr")).not.toHaveAttribute(
        "tabindex",
      );
    });
  });

  describe("row actions", () => {
    it("renders the actions slot in every row", () => {
      renderTable({
        renderRowActions: (row) => <button type="button">Edit {row.firstName}</button>,
      });

      expect(screen.getByRole("button", { name: "Edit Ada" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Edit Grace" })).toBeInTheDocument();
      expect(screen.getByRole("columnheader", { name: "Actions" })).toBeInTheDocument();
    });

    it("does not click the row when an action is clicked", async () => {
      const onRowClick = vi.fn();
      const onEdit = vi.fn();
      const { user } = renderTable({
        onRowClick,
        renderRowActions: () => (
          <button type="button" onClick={onEdit}>
            Edit
          </button>
        ),
      });

      await user.click(screen.getAllByRole("button", { name: "Edit" })[0]!);

      expect(onEdit).toHaveBeenCalledTimes(1);
      expect(onRowClick).not.toHaveBeenCalled();
    });
  });

  describe("selection", () => {
    it("does not render checkboxes unless selectable", () => {
      renderTable();

      expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    });

    it("selects a row with its checkbox", async () => {
      const onSelectionChange = vi.fn();
      const { user } = renderTable({ selectable: true, selectedIds: ["2"], onSelectionChange });

      await user.click(screen.getByRole("checkbox", { name: "Select row 1" }));

      expect(onSelectionChange).toHaveBeenCalledWith(["2", "1"]);
    });

    it("does not click the row when its checkbox is clicked", async () => {
      const onRowClick = vi.fn();
      const { user } = renderTable({ selectable: true, onRowClick, onSelectionChange: vi.fn() });

      await user.click(screen.getByRole("checkbox", { name: "Select row 1" }));

      expect(onRowClick).not.toHaveBeenCalled();
    });

    it("selects all rows of the page with the header checkbox", async () => {
      const onSelectionChange = vi.fn();
      const { user } = renderTable({ selectable: true, onSelectionChange });

      await user.click(screen.getByRole("checkbox", { name: "Select all rows" }));

      expect(onSelectionChange).toHaveBeenCalledWith(["1", "2"]);
    });

    it("shows the header checkbox as mixed when only some rows are selected", () => {
      renderTable({ selectable: true, selectedIds: ["1"] });

      expect(screen.getByRole("checkbox", { name: "Select all rows" })).toHaveAttribute(
        "aria-checked",
        "mixed",
      );
      expect(screen.getByRole("checkbox", { name: "Select row 1" })).toBeChecked();
    });
  });

  describe("hiding a column below a width", () => {
    const originalWidth = window.innerWidth;
    const setWidth = (width: number) => {
      window.innerWidth = width;
      window.dispatchEvent(new Event("resize"));
    };
    const hidingColumns: DataTableColumn<Person>[] = [
      columns[0]!,
      { ...columns[1]!, hideBelow: 1024 },
    ];

    afterEach(() => {
      window.innerWidth = originalWidth;
    });

    it("shows the column at its limit and hides it below the limit", () => {
      window.innerWidth = 1024;
      renderTable({ columns: hidingColumns });
      expect(screen.getByRole("columnheader", { name: "Position" })).toBeInTheDocument();

      act(() => setWidth(1023));

      expect(screen.queryByRole("columnheader", { name: "Position" })).not.toBeInTheDocument();
      expect(screen.queryByRole("cell", { name: "Admiral" })).not.toBeInTheDocument();
      expect(screen.getByRole("cell", { name: "Ada" })).toBeInTheDocument();
    });

    it("shows the column again when the window grows", () => {
      window.innerWidth = 800;
      renderTable({ columns: hidingColumns });
      expect(screen.queryByRole("columnheader", { name: "Position" })).not.toBeInTheDocument();

      act(() => setWidth(1200));

      expect(screen.getByRole("columnheader", { name: "Position" })).toBeInTheDocument();
    });
  });

  describe("row detail", () => {
    it("draws a detail line under each row across the full width", () => {
      renderTable({
        selectable: true,
        renderRowActions: () => <button type="button">Edit</button>,
        renderRowDetail: (row) => <p>About {row.firstName}</p>,
      });

      const detail = screen.getByText("About Ada").closest("td");
      expect(detail).toHaveAttribute("colspan", "4");
      expect(detail?.closest("tr")?.previousElementSibling).toBe(
        screen.getByRole("cell", { name: "Ada" }).closest("tr"),
      );
      expect(screen.getByText("About Grace")).toBeInTheDocument();
    });

    it("draws no line for a row whose detail is null", () => {
      renderTable({ renderRowDetail: (row) => (row.id === "1" ? <p>About Ada</p> : null) });

      expect(screen.getByText("About Ada")).toBeInTheDocument();
      expect(screen.getAllByRole("row")).toHaveLength(4);
    });

    it("draws no extra row without renderRowDetail", () => {
      renderTable();

      expect(screen.getAllByRole("row")).toHaveLength(3);
    });
  });

  describe("states", () => {
    it("shows the loading content instead of the rows and keeps the header", () => {
      renderTable({ loading: true, loadingContent: "Loading…" });

      expect(screen.getByRole("table")).toHaveAttribute("aria-busy", "true");
      expect(screen.getByText("Loading…")).toBeInTheDocument();
      expect(screen.queryByRole("cell", { name: "Ada" })).not.toBeInTheDocument();
      expect(screen.getByRole("columnheader", { name: "First name" })).toBeInTheDocument();
    });

    it("shows the empty content when there are no rows", () => {
      renderTable({ rows: [], emptyContent: "No users found" });

      expect(screen.getByText("No users found")).toBeInTheDocument();
    });

    it("spans the message over all columns", () => {
      renderTable({
        rows: [],
        emptyContent: "No users found",
        selectable: true,
        renderRowActions: () => null,
      });

      expect(screen.getByText("No users found").closest("td")).toHaveAttribute("colspan", "4");
    });

    it("disables the select-all checkbox while loading or empty", () => {
      renderTable({ selectable: true, rows: [] });

      expect(screen.getByRole("checkbox", { name: "Select all rows" })).toBeDisabled();
    });
  });

  it("uses the given labels", () => {
    renderTable({
      selectable: true,
      renderRowActions: () => null,
      labels: {
        actions: "Akcje",
        selectAll: "Zaznacz wszystko",
        selectRow: (row) => `Zaznacz ${row.firstName}`,
      },
    });

    expect(screen.getByRole("columnheader", { name: "Akcje" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Zaznacz wszystko" })).toBeInTheDocument();
    const row = screen.getByRole("cell", { name: "Ada" }).closest("tr");
    expect(within(row!).getByRole("checkbox", { name: "Zaznacz Ada" })).toBeInTheDocument();
  });
});
