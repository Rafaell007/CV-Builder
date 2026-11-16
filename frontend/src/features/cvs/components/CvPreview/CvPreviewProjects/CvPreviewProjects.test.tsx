import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/shared/testing";
import { cvPreviewSample } from "../../../useCvPreview/cvPreview.mocks";
import { CvPreviewProjects } from "./CvPreviewProjects";

function projectArticle(name: string): HTMLElement {
  const article = screen.getByRole("heading", { level: 3, name }).closest("article");
  if (!article) throw new Error(`No article for ${name}`);
  return article;
}

describe("CvPreviewProjects", () => {
  it("shows every detail of a full project", () => {
    renderWithProviders(<CvPreviewProjects projects={cvPreviewSample.projects} />);

    expect(screen.getByRole("heading", { level: 2, name: "Projects" })).toBeInTheDocument();
    const project = within(projectArticle("Banking Portal"));
    expect(project.getByText("A web portal for retail banking customers.")).toBeInTheDocument();
    expect(project.getByText("Frontend Developer, Team Lead")).toBeInTheDocument();
    expect(project.getByText("Jan 2022 - Present")).toBeInTheDocument();
    expect(project.getByText("Built the account pages and led code reviews.")).toBeInTheDocument();
    expect(project.getByText("React, TypeScript")).toBeInTheDocument();
  });

  it("hides the roles and the responsibilities of a project that has none", () => {
    renderWithProviders(<CvPreviewProjects projects={cvPreviewSample.projects} />);

    const project = within(projectArticle("Online Shop"));
    expect(project.queryByText("Roles")).not.toBeInTheDocument();
    expect(project.queryByText("Responsibilities")).not.toBeInTheDocument();
    expect(project.getByText("Mar 2020 - Dec 2021")).toBeInTheDocument();
    expect(project.getByText("Next.js")).toBeInTheDocument();
  });

  it("shows the period text exactly as the backend sent it", () => {
    const [first] = cvPreviewSample.projects;
    if (!first) throw new Error("The sample has no project");
    renderWithProviders(
      <CvPreviewProjects projects={[{ ...first, period: "03.2022 – Till now" }]} />,
    );

    expect(screen.getByText("03.2022 – Till now")).toBeInTheDocument();
  });
});
