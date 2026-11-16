import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/shared/testing";
import { cvPreviewSample } from "../../../useCvPreview/cvPreview.mocks";
import { CvPreviewSummary } from "./CvPreviewSummary";

describe("CvPreviewSummary", () => {
  it("shows the CV name and the description under a Summary heading", () => {
    renderWithProviders(
      <CvPreviewSummary name={cvPreviewSample.name} description={cvPreviewSample.description} />,
    );

    expect(screen.getByRole("heading", { level: 2, name: "Summary" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Frontend Developer" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Builds web applications with React and TypeScript."),
    ).toBeInTheDocument();
  });

  it("hides the description when it is empty", () => {
    renderWithProviders(<CvPreviewSummary name="My CV" description="" />);

    expect(screen.getByRole("heading", { level: 3, name: "My CV" })).toBeInTheDocument();
    expect(screen.queryByText("Builds web applications with React and TypeScript.")).toBeNull();
  });
});
