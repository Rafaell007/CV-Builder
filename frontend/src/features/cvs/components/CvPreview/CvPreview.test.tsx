import { describe, expect, it } from "vitest";
import { renderWithProviders, screen, waitFor } from "@/shared/testing";
import {
  cvPreviewCodeErrorMock,
  cvPreviewErrorMock,
  cvPreviewForbiddenMock,
  cvPreviewMock,
} from "../../useCvPreview/cvPreview.mocks";
import { CvPreview } from "./CvPreview";

const CV_ID = "cv-1";

describe("CvPreview", () => {
  it("shows the loading state first", () => {
    renderWithProviders(<CvPreview cvId={CV_ID} />, { mocks: [cvPreviewMock()] });

    expect(screen.getByRole("status", { name: "Loading CV preview" })).toBeInTheDocument();
  });

  it("shows all sections of the document (AC-1)", async () => {
    renderWithProviders(<CvPreview cvId={CV_ID} />, { mocks: [cvPreviewMock()] });

    expect(await screen.findByText("Anna Kowalska")).toBeInTheDocument();
    expect(screen.getByRole("article", { name: "CV preview" })).toBeInTheDocument();
    for (const name of [
      "General information",
      "Summary",
      "Skills",
      "Projects",
      "Professional skills",
    ]) {
      expect(screen.getByRole("heading", { level: 2, name })).toBeInTheDocument();
    }
    expect(screen.getByRole("table", { name: "Professional skills" })).toBeInTheDocument();
    expect(screen.getByText("Banking Portal")).toBeInTheDocument();
    // The page h1 belongs to CvLayout, so the document adds none.
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /pdf/i })).not.toBeInTheDocument();
  });

  it("shows the error and loads again after Retry (AC-46)", async () => {
    const { user } = renderWithProviders(<CvPreview cvId={CV_ID} />, {
      mocks: [cvPreviewErrorMock(CV_ID), cvPreviewMock()],
    });

    expect(await screen.findByText("Failed to load CV preview")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByText("Anna Kowalska")).toBeInTheDocument();
    expect(screen.queryByText("Failed to load CV preview")).not.toBeInTheDocument();
  });

  it.each([
    ["forbidden", cvPreviewForbiddenMock(CV_ID)],
    ["not found", cvPreviewCodeErrorMock(CV_ID, "NOT_FOUND")],
  ])("shows the unauthorized state without CV data when the CV is %s", async (_name, mock) => {
    renderWithProviders(<CvPreview cvId={CV_ID} />, { mocks: [mock] });

    expect(await screen.findByText("You are not authorized to access this CV")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
    expect(screen.queryByText("Anna Kowalska")).not.toBeInTheDocument();
  });

  it("shows the empty state when the backend sends no preview", async () => {
    renderWithProviders(<CvPreview cvId={CV_ID} />, {
      mocks: [
        {
          request: cvPreviewMock().request,
          result: { data: { cvPreview: null } },
        },
      ],
    });

    await waitFor(() =>
      expect(screen.getByText("CV preview is not available")).toBeInTheDocument(),
    );
  });
});
