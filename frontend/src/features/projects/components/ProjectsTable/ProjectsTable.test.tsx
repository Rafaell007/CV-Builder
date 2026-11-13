import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/shared/testing";
import {
  blog,
  MAX_DESCRIPTION_LENGTH,
  MAX_DOMAIN_LENGTH,
  MAX_NAME_LENGTH,
  maxLengthProject,
  sales,
  sampleProjects,
} from "../../projects.mocks";
import { ProjectsTable } from "./ProjectsTable";

const render = (props: Partial<Parameters<typeof ProjectsTable>[0]> = {}, locale?: "en" | "pl") =>
  renderWithProviders(
    <ProjectsTable
      projects={[blog, sales]}
      sort={undefined}
      onSortChange={() => undefined}
      onEdit={() => undefined}
      onDelete={() => undefined}
      loading={false}
      loadingContent={<p>Loading content</p>}
      emptyContent={<p>Empty content</p>}
      {...props}
    />,
    locale ? { locale } : {},
  );

describe("ProjectsTable", () => {
  it("shows the column headers", () => {
    render();

    const headers = screen.getAllByRole("columnheader").map((header) => header.textContent);
    expect(headers).toEqual(["Name", "Domain", "Start Date", "End Date", "Actions"]);
  });

  it("shows name, description, domain and environment tags of a project", () => {
    render();

    const row = screen.getByRole("row", { name: /Blog/ });
    expect(within(row).getByText("Blogging")).toBeInTheDocument();
    // The description and the tags sit in the detail line under the row, not in the Name cell.
    expect(within(row).queryByText(blog.description)).not.toBeInTheDocument();
    const detail = row.nextElementSibling as HTMLElement;
    expect(detail).toHaveAttribute("data-row-detail");
    expect(within(detail).getByText(blog.description)).toBeInTheDocument();
    const tags = within(detail)
      .getAllByRole("listitem")
      .map((tag) => tag.textContent);
    expect(tags).toEqual(["HTML5", "CSS3", "TypeScript", "React", "Zustand", "Firebase"]);
  });

  it("hides the Domain column below the desktop width", () => {
    const original = window.innerWidth;
    window.innerWidth = 768;
    try {
      render();

      const headers = screen.getAllByRole("columnheader").map((header) => header.textContent);
      expect(headers).toEqual(["Name", "Start Date", "End Date", "Actions"]);
      expect(screen.queryByText("Blogging")).not.toBeInTheDocument();
    } finally {
      window.innerWidth = original;
    }
  });

  it("writes the dates as MM/DD/YYYY in English", () => {
    render();

    const row = screen.getByRole("row", { name: /Blog/ });
    expect(within(row).getByText("12/31/2025")).toBeInTheDocument();
    expect(within(row).getByText("05/31/2026")).toBeInTheDocument();
  });

  it("writes the dates as DD.MM.YYYY and the headers in Polish", () => {
    render({}, "pl");

    const row = screen.getByRole("row", { name: /Blog/ });
    expect(within(row).getByText("31.12.2025")).toBeInTheDocument();
    expect(within(row).getByText("31.05.2026")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Data rozpoczęcia" })).toBeInTheDocument();
  });

  it("shows a dash with a text for screen readers when a date cannot be read", () => {
    render({ projects: [{ ...blog, startDate: "not a date" }] });

    const row = screen.getByRole("row", { name: /Blog/ });
    expect(within(row).getByRole("img", { name: "Date not available" })).toHaveTextContent("—");
    expect(within(row).getByText("05/31/2026")).toBeInTheDocument();
  });

  it("says in Polish that a date is missing", () => {
    render({ projects: [{ ...blog, endDate: "" }] }, "pl");

    expect(screen.getByRole("img", { name: "Brak daty" })).toBeInTheDocument();
  });

  it("shows every sample project with a description of 100 characters or more", () => {
    sampleProjects.forEach((project) => {
      expect(project.description.length).toBeGreaterThanOrEqual(100);
    });

    render({ projects: sampleProjects });

    sampleProjects.forEach((project) => {
      expect(screen.getByText(project.description)).toBeInTheDocument();
    });
  });

  it("shows a project with the longest texts the form allows, in full", () => {
    expect(maxLengthProject.name).toHaveLength(MAX_NAME_LENGTH);
    expect(maxLengthProject.domain).toHaveLength(MAX_DOMAIN_LENGTH);
    expect(maxLengthProject.description).toHaveLength(MAX_DESCRIPTION_LENGTH);

    render({ projects: [maxLengthProject] });

    expect(screen.getByText(maxLengthProject.description)).toBeInTheDocument();
    expect(screen.getByText(maxLengthProject.domain)).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(maxLengthProject.environment.length);
  });

  it("lets the user sort by Name, Start Date and End Date, but not by Domain", () => {
    render();

    expect(screen.getByRole("button", { name: "Name" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start Date" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "End Date" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Domain" })).not.toBeInTheDocument();
  });

  it("reports the backend field and the direction of a click on a header", async () => {
    const onSortChange = vi.fn();
    const { user } = render({ onSortChange });

    await user.click(screen.getByRole("button", { name: "Start Date" }));

    expect(onSortChange).toHaveBeenCalledWith({ field: "startDate", direction: "ASC" });
  });

  it("shows the active sort in the header of that column only", () => {
    render({ sort: { field: "endDate", direction: "DESC" } });

    expect(screen.getByRole("columnheader", { name: "End Date" })).toHaveAttribute(
      "aria-sort",
      "descending",
    );
    expect(screen.getByRole("columnheader", { name: "Name" })).toHaveAttribute("aria-sort", "none");
  });

  it("keeps the order of the rows it gets, because the backend does the sorting", () => {
    // Blog (name B) is given before Cloud Sales (name C) although the sort is by name, descending.
    render({ projects: [blog, sales], sort: { field: "name", direction: "DESC" } });

    const names = screen
      .getAllByRole("row")
      .slice(1)
      .filter((row) => !row.hasAttribute("data-row-detail"))
      .map((row) => within(row).getByText(/^(Blog|Cloud Sales Management)$/).textContent);
    expect(names).toEqual(["Blog", "Cloud Sales Management"]);
  });

  it("shows the loading content instead of the rows, and keeps the headers", () => {
    render({ loading: true });

    expect(screen.getByText("Loading content")).toBeInTheDocument();
    expect(screen.queryByText("Blog")).not.toBeInTheDocument();
    expect(screen.getAllByRole("columnheader")).toHaveLength(5);
  });

  it("shows the empty content when there are no projects", () => {
    render({ projects: [] });

    expect(screen.getByText("Empty content")).toBeInTheDocument();
  });

  describe("row action menu", () => {
    it("gives each row its own menu button, named with the project name", () => {
      render();

      expect(screen.getByRole("button", { name: "Actions for Blog" })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Actions for Cloud Sales Management" }),
      ).toBeInTheDocument();
    });

    it("keeps the menu closed until the button is clicked, then shows Edit and Delete", async () => {
      const { user } = render();
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Actions for Blog" }));

      const items = screen.getAllByRole("menuitem").map((item) => item.textContent);
      expect(items).toEqual(["Edit", "Delete"]);
    });

    it("calls onEdit with the project of the row and closes the menu", async () => {
      const onEdit = vi.fn();
      const onDelete = vi.fn();
      const { user } = render({ onEdit, onDelete });
      await user.click(screen.getByRole("button", { name: "Actions for Cloud Sales Management" }));

      await user.click(screen.getByRole("menuitem", { name: "Edit" }));

      expect(onEdit).toHaveBeenCalledOnce();
      expect(onEdit).toHaveBeenCalledWith(sales);
      expect(onDelete).not.toHaveBeenCalled();
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });

    it("calls onDelete with the project of the row and closes the menu", async () => {
      const onEdit = vi.fn();
      const onDelete = vi.fn();
      const { user } = render({ onEdit, onDelete });
      await user.click(screen.getByRole("button", { name: "Actions for Blog" }));

      await user.click(screen.getByRole("menuitem", { name: "Delete" }));

      expect(onDelete).toHaveBeenCalledOnce();
      expect(onDelete).toHaveBeenCalledWith(blog);
      expect(onEdit).not.toHaveBeenCalled();
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });

    it("closes on Escape and gives the focus back to the button", async () => {
      const { user } = render();
      const button = screen.getByRole("button", { name: "Actions for Blog" });
      await user.click(button);

      await user.keyboard("{Escape}");

      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
      expect(button).toHaveFocus();
    });

    it("closes on a click outside", async () => {
      const { user } = render();
      await user.click(screen.getByRole("button", { name: "Actions for Blog" }));

      // Radix blocks pointer events on the page while the menu is open and listens for pointerdown.
      fireEvent.pointerDown(document.body);

      await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    });

    it("keeps only one menu open at a time", async () => {
      const { user } = render();
      await user.click(screen.getByRole("button", { name: "Actions for Blog" }));

      // The open menu hides the rest of the page, so the second button is found with hidden: true.
      fireEvent.pointerDown(
        screen.getByRole("button", { name: "Actions for Cloud Sales Management", hidden: true }),
      );

      await waitFor(() => expect(screen.getAllByRole("menu")).toHaveLength(1));
      expect(screen.getAllByRole("menuitem")).toHaveLength(2);
    });

    it("works with the keyboard: open, move, select", async () => {
      const onDelete = vi.fn();
      const { user } = render({ onDelete });
      screen.getByRole("button", { name: "Actions for Blog" }).focus();

      await user.keyboard("{Enter}");
      expect(screen.getByRole("menu")).toBeInTheDocument();
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{Enter}");

      expect(onDelete).toHaveBeenCalledWith(blog);
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });

    it("gives the actions column a header that screen readers can read", () => {
      // jsdom does not load the CSS module, so this test cannot check that the header is hidden from sight.
      // The hiding is done by the DataTable class visuallyHidden; check it in Storybook.
      render();

      expect(screen.getByRole("columnheader", { name: "Actions" })).toBeInTheDocument();
    });

    it("uses the Polish texts on the Polish page", async () => {
      const { user } = render({}, "pl");

      await user.click(screen.getByRole("button", { name: "Akcje dla projektu Blog" }));

      const items = screen.getAllByRole("menuitem").map((item) => item.textContent);
      expect(items).toEqual(["Edytuj", "Usuń"]);
    });
  });
});
