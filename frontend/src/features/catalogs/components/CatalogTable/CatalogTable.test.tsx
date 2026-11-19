import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/shared/testing";
import type { CatalogItem } from "../../catalogs.types";
import { CatalogTable, type CatalogTableProps } from "./CatalogTable";

const engineering: CatalogItem = { id: "1", name: "Engineering" };
const finance: CatalogItem = { id: "2", name: "Finance" };

function renderTable(props: Partial<CatalogTableProps<CatalogItem>> = {}) {
  const handlers = { onSortChange: vi.fn(), onEdit: vi.fn(), onDelete: vi.fn() };
  const result = renderWithProviders(
    <CatalogTable
      namespace="catalogs.departments"
      items={[engineering, finance]}
      sort={{ field: "name", direction: "ASC" }}
      loading={false}
      loadingContent={<p>Loading content</p>}
      emptyContent={<p>Empty content</p>}
      {...handlers}
      {...props}
    />,
  );
  return { ...result, ...handlers };
}

describe("CatalogTable", () => {
  it("shows the Name column sorted as given and one row per item with an Actions column", () => {
    renderTable();

    expect(screen.getByRole("table", { name: "Departments list" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Name" })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
    expect(screen.getByRole("columnheader", { name: "Actions" })).toBeInTheDocument();
    const rows = screen.getAllByRole("row").slice(1);
    expect(rows.map((row) => within(row).getAllByRole("cell")[0]!.textContent)).toEqual([
      "Engineering",
      "Finance",
    ]);
  });

  it("reports a click on the Name header", async () => {
    const { user, onSortChange } = renderTable();

    await user.click(screen.getByRole("button", { name: "Name" }));

    expect(onSortChange).toHaveBeenCalledExactlyOnceWith({ field: "name", direction: "DESC" });
  });

  it("calls onEdit and onDelete with the item of the row menu", async () => {
    const { user, onEdit, onDelete } = renderTable();

    await user.click(screen.getByRole("button", { name: "Actions for Finance" }));
    await user.click(screen.getByRole("menuitem", { name: "Edit" }));
    expect(onEdit).toHaveBeenCalledExactlyOnceWith(finance);

    await user.click(screen.getByRole("button", { name: "Actions for Engineering" }));
    await user.click(screen.getByRole("menuitem", { name: "Delete" }));
    expect(onDelete).toHaveBeenCalledExactlyOnceWith(engineering);
  });

  it("shows the loading content while loading", () => {
    renderTable({ items: [], loading: true });

    expect(screen.getByText("Loading content")).toBeInTheDocument();
  });

  it("shows the empty content when there are no items", () => {
    renderTable({ items: [] });

    expect(screen.getByText("Empty content")).toBeInTheDocument();
  });

  it("uses the texts of the namespace it gets", () => {
    renderTable({ namespace: "catalogs.positions" });

    expect(screen.getByRole("table", { name: "Positions list" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Actions for Finance" })).toBeInTheDocument();
  });
});
