import { CombinedGraphQLErrors } from "@apollo/client";
import { screen, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { UseListStateResult, UsePagedListResult } from "@/shared/lists";
import { renderWithProviders } from "@/shared/testing";
import { DEFAULT_CATALOG_SORT } from "../../catalogs.constants";
import type { CatalogItem } from "../../catalogs.types";
import { useCreateCatalogItemForm } from "../../useCreateCatalogItemForm";
import { useDeleteCatalogItem } from "../../useDeleteCatalogItem";
import { useUpdateCatalogItemForm } from "../../useUpdateCatalogItemForm";
import { CatalogPage } from "./CatalogPage";

const engineering: CatalogItem = { id: "1", name: "Engineering" };
const finance: CatalogItem = { id: "2", name: "Finance" };

const query = (changes: Partial<UsePagedListResult<CatalogItem>> = {}) =>
  ({
    items: [],
    total: 0,
    loading: false,
    failed: false,
    error: undefined,
    retry: vi.fn(),
    ...changes,
  }) satisfies UsePagedListResult<CatalogItem>;

const listState = (changes: Partial<UseListStateResult> = {}): UseListStateResult => ({
  search: "",
  sort: DEFAULT_CATALOG_SORT,
  page: 1,
  setSearch: vi.fn(),
  setSort: vi.fn(),
  setPage: vi.fn(),
  ...changes,
});

interface HarnessProps {
  list?: UseListStateResult;
  query?: UsePagedListResult<CatalogItem>;
  remove?: (id: string) => Promise<unknown>;
}

// The page takes the state of the real flow hooks, so the test drives it like the pages do.
function Harness({
  list = listState(),
  query: pagedQuery = query(),
  remove = vi.fn().mockResolvedValue(undefined),
}: HarnessProps) {
  const creation = useCreateCatalogItemForm("catalogs.departments", vi.fn());
  const editing = useUpdateCatalogItemForm("catalogs.departments", vi.fn());
  const deletion = useDeleteCatalogItem("catalogs.departments", remove);
  return (
    <CatalogPage
      namespace="catalogs.departments"
      list={list}
      query={pagedQuery}
      creation={creation}
      editing={editing}
      deletion={deletion}
    />
  );
}

describe("CatalogPage", () => {
  it("shows the loading state inside the table", () => {
    renderWithProviders(<Harness query={query({ loading: true })} />);

    expect(screen.getByRole("status", { name: "Loading departments" })).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Departments list" })).toBeInTheDocument();
  });

  it("shows the rows of the query", () => {
    renderWithProviders(<Harness query={query({ items: [engineering, finance], total: 2 })} />);

    expect(screen.getByText("Engineering")).toBeInTheDocument();
    expect(screen.getByText("Finance")).toBeInTheDocument();
  });

  it("shows the empty state for an empty catalog", () => {
    renderWithProviders(<Harness />);

    expect(screen.getByText("No departments found")).toBeInTheDocument();
  });

  it("shows the no results state for a search without rows", () => {
    renderWithProviders(<Harness list={listState({ search: "xyz" })} />);

    expect(screen.getByText("No departments found")).toBeInTheDocument();
  });

  it("shows an error with Retry instead of an empty table, and Retry calls retry", async () => {
    const retry = vi.fn();
    const { user } = renderWithProviders(<Harness query={query({ failed: true, retry })} />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Something went wrong. Please try again later",
    );
    expect(screen.queryByText("No departments found")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(retry).toHaveBeenCalledOnce();
  });

  it("reports the search and a page click to the list state", async () => {
    const list = listState();
    const { user } = renderWithProviders(
      <Harness list={list} query={query({ items: [engineering], total: 11 })} />,
    );

    await user.type(screen.getByRole("searchbox", { name: "Search departments" }), "fin{Enter}");
    await user.click(screen.getByRole("button", { name: "Page 2" }));

    expect(list.setSearch).toHaveBeenCalledWith("fin");
    expect(list.setPage).toHaveBeenCalledWith(2);
  });

  it("opens the Create modal from the create button", async () => {
    const { user } = renderWithProviders(<Harness />);

    await user.click(screen.getByRole("button", { name: "CREATE DEPARTMENT" }));

    expect(await screen.findByRole("dialog", { name: "Create department" })).toBeInTheDocument();
  });

  it("opens the Update modal with the name of the row", async () => {
    const { user } = renderWithProviders(<Harness query={query({ items: [finance], total: 1 })} />);

    await user.click(screen.getByRole("button", { name: "Actions for Finance" }));
    await user.click(screen.getByRole("menuitem", { name: "Edit" }));

    const dialog = await screen.findByRole("dialog", { name: "Edit department" });
    expect(within(dialog).getByRole("textbox", { name: "Department" })).toHaveValue("Finance");
  });

  it("asks to confirm a delete with the name, then deletes the id of the row", async () => {
    const remove = vi.fn().mockResolvedValue(undefined);
    const { user } = renderWithProviders(
      <Harness remove={remove} query={query({ items: [engineering, finance], total: 2 })} />,
    );

    await user.click(screen.getByRole("button", { name: "Actions for Finance" }));
    await user.click(screen.getByRole("menuitem", { name: "Delete" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveTextContent("Are you sure you want to delete department Finance?");
    await user.click(within(dialog).getByRole("button", { name: "Confirm" }));

    expect(remove).toHaveBeenCalledExactlyOnceWith("2");
  });

  it("goes back one page after the only row of the last page is deleted", async () => {
    const list = listState({ page: 2 });
    const { user } = renderWithProviders(
      <Harness list={list} query={query({ items: [finance], total: 11 })} />,
    );

    await user.click(screen.getByRole("button", { name: "Actions for Finance" }));
    await user.click(screen.getByRole("menuitem", { name: "Delete" }));
    await user.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Confirm" }),
    );

    await vi.waitFor(() => expect(list.setPage).toHaveBeenCalledExactlyOnceWith(1));
  });

  it("stays on the page when the delete fails", async () => {
    const list = listState({ page: 2 });
    const { user } = renderWithProviders(
      <Harness
        list={list}
        query={query({ items: [finance], total: 11 })}
        remove={vi.fn().mockRejectedValue(new Error("Failed to fetch"))}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Actions for Finance" }));
    await user.click(screen.getByRole("menuitem", { name: "Delete" }));
    await user.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Confirm" }),
    );

    expect(await screen.findByText("Something went wrong. Please try again.")).toBeInTheDocument();
    expect(list.setPage).not.toHaveBeenCalled();
  });

  it("shows the loading state, never the empty state, when the last row of a later page is deleted", async () => {
    const list = listState({ page: 2 });
    // The row leaves the list as the request resolves (the cache eviction), before the page changes.
    function Evicting() {
      const [items, setItems] = useState([finance]);
      return (
        <Harness
          list={list}
          query={query({ items, total: 11 })}
          remove={async () => {
            setItems([]);
          }}
        />
      );
    }
    const { user } = renderWithProviders(<Evicting />);

    await user.click(screen.getByRole("button", { name: "Actions for Finance" }));
    await user.click(screen.getByRole("menuitem", { name: "Delete" }));
    await user.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Confirm" }),
    );

    await vi.waitFor(() => expect(list.setPage).toHaveBeenCalledExactlyOnceWith(1));
    expect(screen.getByRole("status", { name: "Loading departments" })).toBeInTheDocument();
    expect(screen.queryByText("No departments found")).not.toBeInTheDocument();
  });

  it("keeps the delete modal open with the in-use message, so the page and its rows stay", async () => {
    const list = listState({ page: 2 });
    const inUse = new CombinedGraphQLErrors({
      errors: [{ message: "Used", extensions: { code: "CONFLICT" } }],
    });
    const { user } = renderWithProviders(
      <Harness
        list={list}
        query={query({ items: [finance], total: 11 })}
        remove={vi.fn().mockRejectedValue(inUse)}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Actions for Finance" }));
    await user.click(screen.getByRole("menuitem", { name: "Delete" }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Confirm" }));

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "Department cannot be deleted because it is currently in use",
    );
    expect(within(dialog).getByRole("button", { name: "Cancel" })).toBeEnabled();
    expect(within(dialog).getByRole("button", { name: "Confirm" })).toBeEnabled();
    expect(list.setPage).not.toHaveBeenCalled();
    expect(list.setSearch).not.toHaveBeenCalled();
    expect(list.setSort).not.toHaveBeenCalled();
  });
});
