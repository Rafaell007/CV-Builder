import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/shared/testing";
import { cvPreviewSample } from "../../../useCvPreview/cvPreview.mocks";
import { CvPreviewGeneral } from "./CvPreviewGeneral";

const { education, languages, domains } = cvPreviewSample;

describe("CvPreviewGeneral", () => {
  it("shows the education, the languages with their level and the domains", () => {
    renderWithProviders(
      <CvPreviewGeneral education={education} languages={languages} domains={domains} />,
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "General information" }),
    ).toBeInTheDocument();
    expect(screen.getByText("MSc Computer Science")).toBeInTheDocument();
    expect(screen.getByText("English — C1")).toBeInTheDocument();
    expect(screen.getByText("Polish — NATIVE")).toBeInTheDocument();
    const domainBlock = screen.getByRole("heading", { name: "Domains" }).parentElement;
    expect(domainBlock).not.toBeNull();
    expect(
      within(domainBlock as HTMLElement)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(["Fintech", "E-commerce"]);
  });

  it("hides the languages and the domains when the lists are empty", () => {
    renderWithProviders(<CvPreviewGeneral education={education} languages={[]} domains={[]} />);

    expect(screen.queryByRole("heading", { name: "Languages" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Domains" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Education" })).toBeInTheDocument();
  });

  it("hides the education when it is empty", () => {
    renderWithProviders(<CvPreviewGeneral education="" languages={languages} domains={domains} />);

    expect(screen.queryByRole("heading", { name: "Education" })).not.toBeInTheDocument();
  });
});
