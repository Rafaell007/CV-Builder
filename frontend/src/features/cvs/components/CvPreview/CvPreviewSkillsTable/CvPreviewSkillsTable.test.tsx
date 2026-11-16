import { describe, expect, it } from "vitest";
import { renderWithProviders, screen, within } from "@/shared/testing";
import { cvPreviewSample } from "../../../useCvPreview/cvPreview.mocks";
import { CvPreviewSkillsTable } from "./CvPreviewSkillsTable";

const groups = cvPreviewSample.skillGroups;

describe("CvPreviewSkillsTable", () => {
  it("is a table with a name and four column headers (AC-16)", () => {
    renderWithProviders(<CvPreviewSkillsTable skillGroups={groups} />);

    expect(screen.getByRole("table", { name: "Professional skills" })).toBeInTheDocument();
    const headers = screen.getAllByRole("columnheader").map((h) => h.textContent);
    expect(headers).toEqual(["Skills Category", "Skill", "Experience in Years", "Last Used"]);
  });

  it("shows the category once per group and spans its rows", () => {
    renderWithProviders(<CvPreviewSkillsTable skillGroups={groups} />);

    expect(screen.getAllByRole("rowheader", { name: "Frontend" })).toHaveLength(1);
    expect(screen.getByRole("rowheader", { name: "Frontend" })).toHaveAttribute("rowspan", "2");
    expect(screen.getByRole("rowheader", { name: "Backend" })).toHaveAttribute("rowspan", "1");
  });

  it("shows the skill, the years and the last used year in a row (AC-17, AC-18)", () => {
    renderWithProviders(<CvPreviewSkillsTable skillGroups={groups} />);

    const row = screen.getByRole("cell", { name: "React" }).closest("tr") as HTMLElement;
    const cells = within(row).getAllByRole("cell");
    expect(cells.map((c) => c.textContent)).toEqual(["React", "5", "2026"]);
  });

  it("shows an en dash with text for screen readers when a value is missing (AC-41)", () => {
    renderWithProviders(<CvPreviewSkillsTable skillGroups={groups} />);

    const row = screen.getByRole("cell", { name: "GraphQL" }).closest("tr") as HTMLElement;
    const cells = within(row).getAllByRole("cell");
    for (const cell of cells.slice(1)) {
      expect(cell).toHaveTextContent("–");
      expect(cell).toHaveTextContent("Not available");
    }
  });

  it("hides a category without skills (AC-8)", () => {
    renderWithProviders(
      <CvPreviewSkillsTable
        skillGroups={[
          ...groups,
          { __typename: "CvPreviewSkillGroup", category: "Empty category", skills: [] },
        ]}
      />,
    );

    expect(screen.queryByText("Empty category")).not.toBeInTheDocument();
  });

  it("keeps only the header row when there are no groups", () => {
    renderWithProviders(<CvPreviewSkillsTable skillGroups={[]} />);

    expect(screen.getAllByRole("row")).toHaveLength(1);
  });

  it("renders a large dataset", () => {
    const many = Array.from({ length: 50 }, (_, c) => ({
      __typename: "CvPreviewSkillGroup" as const,
      category: `Category ${c}`,
      skills: Array.from({ length: 20 }, (_, s) => ({
        __typename: "CvPreviewSkill" as const,
        name: `Skill ${c}-${s}`,
        mastery: "ADVANCED" as const,
        experienceYears: s,
        lastUsedYear: 2026,
      })),
    }));
    renderWithProviders(<CvPreviewSkillsTable skillGroups={many} />);

    expect(screen.getAllByRole("row")).toHaveLength(1001);
  });

  it("shows Polish texts", () => {
    renderWithProviders(<CvPreviewSkillsTable skillGroups={groups} />, { locale: "pl" });

    expect(screen.getByRole("table", { name: "Umiejętności zawodowe" })).toBeInTheDocument();
  });
});
