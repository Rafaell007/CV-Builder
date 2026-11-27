import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/shared/testing";
import { CvPreviewHeader } from "./CvPreviewHeader";

describe("CvPreviewHeader", () => {
  it("shows the full name as a heading and the position", () => {
    renderWithProviders(<CvPreviewHeader fullName="Anna Kowalska" position="Frontend Developer" />);

    expect(screen.getByRole("heading", { level: 2, name: "Anna Kowalska" })).toBeInTheDocument();
    expect(screen.getByText("Frontend Developer")).toBeInTheDocument();
  });

  it("shows only the name when the position is missing", () => {
    renderWithProviders(<CvPreviewHeader fullName="Anna Kowalska" position={null} />);

    expect(screen.getByRole("heading", { name: "Anna Kowalska" })).toBeInTheDocument();
    expect(screen.queryByText("Frontend Developer")).not.toBeInTheDocument();
  });

  it("shows only the position when the name is missing", () => {
    renderWithProviders(<CvPreviewHeader fullName={null} position="Frontend Developer" />);

    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(screen.getByText("Frontend Developer")).toBeInTheDocument();
  });

  it("renders nothing when both are missing", () => {
    renderWithProviders(<CvPreviewHeader fullName={null} position={null} />);

    expect(screen.queryByRole("banner")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });
});
