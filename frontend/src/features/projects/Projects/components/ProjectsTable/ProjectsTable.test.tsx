import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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
    expect(within(row).getByText(blog.description)).toBeInTheDocument();
    const tags = within(row)
      .getAllByRole("listitem")
      .map((tag) => tag.textContent);
    expect(tags).toEqual(["HTML5", "CSS3", "TypeScript", "React", "Zustand", "Firebase"]);
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
