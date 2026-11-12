import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/shared/testing";
import { blog, sales } from "../../projects.mocks";
import { ProjectsTable } from "./ProjectsTable";

const render = (props: Partial<Parameters<typeof ProjectsTable>[0]> = {}, locale?: "en" | "pl") =>
  renderWithProviders(
    <ProjectsTable
      projects={[blog, sales]}
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
    expect(headers).toEqual(["Name", "Domain", "Start Date", "End Date"]);
  });

  it("shows name, description, domain and environment tags of a project", () => {
    render();

    const row = screen.getByRole("row", { name: /Blog/ });
    expect(within(row).getByText("Blogging")).toBeInTheDocument();
    expect(within(row).getByText("A dynamic blogging website.")).toBeInTheDocument();
    const tags = within(row)
      .getAllByRole("listitem")
      .map((tag) => tag.textContent);
    expect(tags).toEqual(["HTML5", "TypeScript"]);
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

  it("shows the loading content instead of the rows, and keeps the headers", () => {
    render({ loading: true });

    expect(screen.getByText("Loading content")).toBeInTheDocument();
    expect(screen.queryByText("Blog")).not.toBeInTheDocument();
    expect(screen.getAllByRole("columnheader")).toHaveLength(4);
  });

  it("shows the empty content when there are no projects", () => {
    render({ projects: [] });

    expect(screen.getByText("Empty content")).toBeInTheDocument();
  });
});
