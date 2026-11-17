import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen, within } from "@/shared/testing";
import { cvPreviewSample } from "../../../useCvPreview";
import { CvPreviewSkillsTable } from "./CvPreviewSkillsTable";

const groups = cvPreviewSample.skillGroups;

describe("CvPreviewSkillsTable", () => {
  it("is a table with a name and one Skills header over the category and skill columns (AC-16)", () => {
    renderWithProviders(<CvPreviewSkillsTable skillGroups={groups} />);

    expect(screen.getByRole("table", { name: "Professional skills" })).toBeInTheDocument();
    const headers = screen.getAllByRole("columnheader");
    expect(headers.map((h) => h.textContent)).toEqual([
      "Skills",
      "Experience in Years",
      "Last Used",
    ]);
    expect(headers[0]).toHaveAttribute("colspan", "2");
    expect(headers[0]).toHaveAttribute("scope", "col");
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
    expect(cells[1]).toHaveTextContent("–");
    expect(cells[1]).toHaveTextContent("Experience in Years: not available");
    expect(cells[2]).toHaveTextContent("–");
    expect(cells[2]).toHaveTextContent("Last Used: not available");
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

  it("shows a message under the header row when there are no skills", () => {
    renderWithProviders(<CvPreviewSkillsTable skillGroups={[]} />);

    expect(screen.getAllByRole("row")).toHaveLength(2);
    expect(screen.getByRole("cell", { name: "No skills added" })).toHaveAttribute("colspan", "4");
  });

  it("renders categories and skills that repeat without a React key warning", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const skill = {
      __typename: "CvPreviewSkill" as const,
      name: "React",
      mastery: "EXPERT" as const,
      experienceYears: 1,
      lastUsedYear: 2026,
    };
    const group = {
      __typename: "CvPreviewSkillGroup" as const,
      category: "Frontend",
      skills: [skill, skill],
    };
    renderWithProviders(<CvPreviewSkillsTable skillGroups={[group, group]} />);

    expect(screen.getAllByRole("cell", { name: "React" })).toHaveLength(4);
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });

  it("keeps the order of the groups and skills and puts each skill in its own row", () => {
    const many = ["Alpha", "Beta", "Gamma"].map((category) => ({
      __typename: "CvPreviewSkillGroup" as const,
      category,
      skills: [1, 2, 3].map((n) => ({
        __typename: "CvPreviewSkill" as const,
        name: `${category} skill ${n}`,
        mastery: "ADVANCED" as const,
        experienceYears: n,
        lastUsedYear: 2020 + n,
      })),
    }));
    renderWithProviders(<CvPreviewSkillsTable skillGroups={many} />);

    expect(screen.getAllByRole("row")).toHaveLength(10);
    expect(screen.getAllByRole("rowheader").map((h) => h.textContent)).toEqual([
      "Alpha",
      "Beta",
      "Gamma",
    ]);
    const skills = screen.getAllByRole("cell").filter((c) => c.textContent?.includes("skill"));
    expect(skills.map((c) => c.textContent)).toEqual(
      many.flatMap((g) => g.skills.map((s) => s.name)),
    );
  });

  it("shows Polish texts", () => {
    renderWithProviders(<CvPreviewSkillsTable skillGroups={groups} />, { locale: "pl" });

    expect(screen.getByRole("table", { name: "Umiejętności zawodowe" })).toBeInTheDocument();
    expect(screen.getByText("Doświadczenie w latach: brak danych")).toBeInTheDocument();
  });
});
