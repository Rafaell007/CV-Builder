import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/shared/testing";
import { cvPreviewSample } from "../../../useCvPreview/cvPreview.mocks";
import { CvPreviewSkills } from "./CvPreviewSkills";

describe("CvPreviewSkills", () => {
  it("shows each category with the names of its skills", () => {
    renderWithProviders(<CvPreviewSkills skillGroups={cvPreviewSample.skillGroups} />);

    expect(screen.getByRole("heading", { level: 2, name: "Skills" })).toBeInTheDocument();
    const frontend = screen.getByRole("heading", { level: 3, name: "Frontend" }).parentElement;
    expect(frontend).not.toBeNull();
    expect(
      within(frontend as HTMLElement)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(["React", "CSS"]);
    expect(screen.getByRole("heading", { level: 3, name: "Backend" })).toBeInTheDocument();
    expect(screen.getByText("GraphQL")).toBeInTheDocument();
  });

  it("renders categories and skills that repeat without a React key warning", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const skill = {
      __typename: "CvPreviewSkill" as const,
      name: "React",
      experienceYears: 1,
      lastUsedYear: 2026,
    };
    const group = {
      __typename: "CvPreviewSkillGroup" as const,
      category: "Frontend",
      skills: [skill, skill],
    };
    renderWithProviders(<CvPreviewSkills skillGroups={[group, group]} />);

    expect(screen.getAllByRole("heading", { level: 3, name: "Frontend" })).toHaveLength(2);
    expect(screen.getAllByText("React")).toHaveLength(4);
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });

  it("renders nothing when no category has skills", () => {
    renderWithProviders(
      <CvPreviewSkills
        skillGroups={[{ __typename: "CvPreviewSkillGroup", category: "Databases", skills: [] }]}
      />,
    );

    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("hides a category without skills", () => {
    renderWithProviders(
      <CvPreviewSkills
        skillGroups={[
          ...cvPreviewSample.skillGroups,
          { __typename: "CvPreviewSkillGroup", category: "Databases", skills: [] },
        ]}
      />,
    );

    expect(screen.queryByRole("heading", { name: "Databases" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Frontend" })).toBeInTheDocument();
  });
});
