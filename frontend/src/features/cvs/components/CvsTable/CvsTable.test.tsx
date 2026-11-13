import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/shared/testing";
import { backendCv, frontendCv } from "../../cvs.mocks";
import { CvsTable } from "./CvsTable";

const render = (props: Partial<Parameters<typeof CvsTable>[0]> = {}, locale?: "en" | "pl") =>
  renderWithProviders(
    <CvsTable
      cvs={[frontendCv, backendCv]}
      sort={undefined}
      onSortChange={() => undefined}
      onView={() => undefined}
      onEdit={() => undefined}
      onDelete={() => undefined}
      loading={false}
      loadingContent={<p>Loading content</p>}
      emptyContent={<p>Empty content</p>}
      {...props}
    />,
    locale ? { locale } : {},
  );

describe("CvsTable", () => {
  it("shows the column headers", () => {
    render();

    const headers = screen.getAllByRole("columnheader").map((header) => header.textContent);
    expect(headers).toEqual(["Name", "Education", "Employee", "Actions"]);
  });

  it("shows name, education and owner email of a CV", () => {
    render();

    const row = screen.getByRole("row", { name: /Frontend Developer/ });
    expect(within(row).getByText(frontendCv.education)).toBeInTheDocument();
    expect(within(row).getByText("anna.kowalska@example.com")).toBeInTheDocument();
  });

  it("shows the description in the detail line under the row, not in a column", () => {
    render();

    const row = screen.getByRole("row", { name: /Frontend Developer/ });
    expect(within(row).queryByText(frontendCv.description)).not.toBeInTheDocument();
    const detail = row.nextElementSibling as HTMLElement;
    expect(detail).toHaveAttribute("data-row-detail");
    expect(within(detail).getByText(frontendCv.description)).toBeInTheDocument();
  });

  it("lets the user sort by Name only", () => {
    render();

    expect(screen.getByRole("button", { name: "Name" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Education" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Employee" })).not.toBeInTheDocument();
  });

  it("reports the backend field and the direction of a click on the Name header", async () => {
    const onSortChange = vi.fn();
    const { user } = render({ onSortChange });

    await user.click(screen.getByRole("button", { name: "Name" }));

    expect(onSortChange).toHaveBeenCalledWith({ field: "name", direction: "ASC" });
  });

  it("shows the active sort in the Name header", () => {
    render({ sort: { field: "name", direction: "DESC" } });

    expect(screen.getByRole("columnheader", { name: "Name" })).toHaveAttribute(
      "aria-sort",
      "descending",
    );
  });

  it("keeps the order of the rows it gets, because the backend does the sorting", () => {
    // Frontend (F) is given before Backend (B) although the sort is by name, ascending.
    render({ cvs: [frontendCv, backendCv], sort: { field: "name", direction: "ASC" } });

    const names = screen
      .getAllByRole("row")
      .slice(1)
      .filter((row) => !row.hasAttribute("data-row-detail"))
      .map((row) => within(row).getByText(/^(Frontend Developer|Backend Engineer)$/).textContent);
    expect(names).toEqual(["Frontend Developer", "Backend Engineer"]);
  });

  it("shows the loading content instead of the rows, and keeps the headers", () => {
    render({ loading: true });

    expect(screen.getByText("Loading content")).toBeInTheDocument();
    expect(screen.queryByText("Frontend Developer")).not.toBeInTheDocument();
    expect(screen.getAllByRole("columnheader")).toHaveLength(4);
  });

  it("shows the empty content when there are no CVs", () => {
    render({ cvs: [] });

    expect(screen.getByText("Empty content")).toBeInTheDocument();
  });

  it("calls onView with the CV of the row on a row click", async () => {
    const onView = vi.fn();
    const { user } = render({ onView });

    await user.click(screen.getByText("Backend Engineer"));

    expect(onView).toHaveBeenCalledOnce();
    expect(onView).toHaveBeenCalledWith(backendCv);
  });

  describe("row action menu", () => {
    it("gives each row its own menu button, named with the CV name", () => {
      render();

      expect(screen.getByRole("button", { name: "Actions for Frontend Developer" })).toBeVisible();
      expect(screen.getByRole("button", { name: "Actions for Backend Engineer" })).toBeVisible();
    });

    it("keeps the menu closed until the button is clicked, then shows View, Edit and Delete", async () => {
      const { user } = render();
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Actions for Frontend Developer" }));

      const items = screen.getAllByRole("menuitem").map((item) => item.textContent);
      expect(items).toEqual(["View", "Edit", "Delete"]);
    });

    it("calls onView with the CV of the row, once, and closes the menu", async () => {
      const onView = vi.fn();
      const { user } = render({ onView });
      await user.click(screen.getByRole("button", { name: "Actions for Backend Engineer" }));

      await user.click(screen.getByRole("menuitem", { name: "View" }));

      // The menu is in the actions cell, so the click does not reach the row a second time.
      expect(onView).toHaveBeenCalledOnce();
      expect(onView).toHaveBeenCalledWith(backendCv);
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });

    it("calls onEdit with the CV of the row and closes the menu", async () => {
      const onView = vi.fn();
      const onEdit = vi.fn();
      const onDelete = vi.fn();
      const { user } = render({ onView, onEdit, onDelete });
      await user.click(screen.getByRole("button", { name: "Actions for Backend Engineer" }));

      await user.click(screen.getByRole("menuitem", { name: "Edit" }));

      expect(onEdit).toHaveBeenCalledOnce();
      expect(onEdit).toHaveBeenCalledWith(backendCv);
      expect(onView).not.toHaveBeenCalled();
      expect(onDelete).not.toHaveBeenCalled();
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });

    it("calls onDelete with the CV of the row and closes the menu", async () => {
      const onView = vi.fn();
      const onEdit = vi.fn();
      const onDelete = vi.fn();
      const { user } = render({ onView, onEdit, onDelete });
      await user.click(screen.getByRole("button", { name: "Actions for Frontend Developer" }));

      await user.click(screen.getByRole("menuitem", { name: "Delete" }));

      expect(onDelete).toHaveBeenCalledOnce();
      expect(onDelete).toHaveBeenCalledWith(frontendCv);
      expect(onView).not.toHaveBeenCalled();
      expect(onEdit).not.toHaveBeenCalled();
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });

    it("closes on Escape and gives the focus back to the button", async () => {
      const { user } = render();
      const button = screen.getByRole("button", { name: "Actions for Frontend Developer" });
      await user.click(button);

      await user.keyboard("{Escape}");

      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
      expect(button).toHaveFocus();
    });

    it("closes on a click outside", async () => {
      const { user } = render();
      await user.click(screen.getByRole("button", { name: "Actions for Frontend Developer" }));

      // Radix blocks pointer events on the page while the menu is open and listens for pointerdown.
      fireEvent.pointerDown(document.body);

      await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    });

    it("works with the keyboard: open, move, select", async () => {
      const onEdit = vi.fn();
      const { user } = render({ onEdit });
      screen.getByRole("button", { name: "Actions for Frontend Developer" }).focus();

      await user.keyboard("{Enter}");
      expect(screen.getByRole("menu")).toBeInTheDocument();
      // The keyboard opens the menu with the first item (View) focused; one arrow down reaches Edit.
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{Enter}");

      expect(onEdit).toHaveBeenCalledWith(frontendCv);
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });

    it("uses the Polish texts on the Polish page", async () => {
      const { user } = render({}, "pl");

      await user.click(screen.getByRole("button", { name: "Akcje dla CV Frontend Developer" }));

      const items = screen.getAllByRole("menuitem").map((item) => item.textContent);
      expect(items).toEqual(["Zobacz", "Edytuj", "Usuń"]);
    });
  });
});
