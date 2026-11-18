import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/shared/testing";
import { ListPage, type ListPageProps } from "./ListPage";

function renderListPage(props: Partial<ListPageProps> = {}) {
  const onCreate = vi.fn();
  const view = renderWithProviders(
    <ListPage
      search={<input aria-label="Search" />}
      createLabel="Create department"
      onCreate={onCreate}
      pagination={<nav aria-label="Pagination" />}
      {...props}
    >
      <table aria-label="Departments list" />
    </ListPage>,
  );
  return { ...view, onCreate };
}

describe("ListPage", () => {
  it("shows the search, the list and the page buttons", () => {
    renderListPage();

    expect(screen.getByRole("textbox", { name: "Search" })).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Departments list" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Pagination" })).toBeInTheDocument();
  });

  it("calls onCreate when the create button is pressed", async () => {
    const { user, onCreate } = renderListPage();

    await user.click(screen.getByRole("button", { name: "Create department" }));

    expect(onCreate).toHaveBeenCalledOnce();
  });

  it("shows the error instead of the list and the page buttons, and keeps the toolbar", () => {
    renderListPage({ error: <p role="alert">Something went wrong</p> });

    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
    expect(screen.queryByRole("table", { name: "Departments list" })).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Pagination" })).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Search" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create department" })).toBeInTheDocument();
  });
});
