import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen, waitFor } from "@/shared/testing";
import {
  exportCvPdfCodeErrorMock,
  exportCvPdfMock,
  exportCvPdfSample,
} from "../../useExportCvPdf/exportCvPdf.mocks";
import {
  cvPreviewCodeErrorMock,
  cvPreviewErrorMock,
  cvPreviewForbiddenMock,
  cvPreviewMock,
} from "../../useCvPreview/cvPreview.mocks";
import { CvPreview } from "./CvPreview";

// The download needs a real browser. The tests check that it is asked for, with the file of the backend.
const saveFile = vi.hoisted(() => vi.fn());
vi.mock("../../useSaveFile", () => ({ useSaveFile: () => saveFile }));

const CV_ID = "cv-1";

describe("CvPreview", () => {
  beforeEach(() => saveFile.mockClear());

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
    expect(screen.getByRole("button", { name: "EXPORT PDF" })).toBeEnabled();
  });

  it("disables EXPORT PDF while loading, after an error and without access (AC-26, AC-48)", async () => {
    const loading = renderWithProviders(<CvPreview cvId={CV_ID} />, { mocks: [cvPreviewMock()] });
    expect(screen.getByRole("button", { name: "EXPORT PDF" })).toBeDisabled();
    await screen.findByText("Anna Kowalska");
    loading.unmount();

    renderWithProviders(<CvPreview cvId={CV_ID} />, { mocks: [cvPreviewErrorMock(CV_ID)] });
    await screen.findByText("Failed to load CV preview");
    expect(screen.getByRole("button", { name: "EXPORT PDF" })).toBeDisabled();
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
  it("saves the PDF of the backend after a click on EXPORT PDF (AC-20, AC-22)", async () => {
    const { user } = renderWithProviders(<CvPreview cvId={CV_ID} />, {
      mocks: [cvPreviewMock(), exportCvPdfMock(CV_ID)],
    });
    await screen.findByText("Anna Kowalska");

    await user.click(screen.getByRole("button", { name: "EXPORT PDF" }));

    await waitFor(() => expect(saveFile).toHaveBeenCalledTimes(1));
    expect(saveFile.mock.calls[0]?.[1]).toBe(exportCvPdfSample.fileName);
    // The preview stays on the page.
    expect(screen.getByText("Anna Kowalska")).toBeInTheDocument();
  });

  it("shows a loading state and ignores a second click while the PDF is made (AC-27, AC-28)", async () => {
    // One export mock only: a second request would find no mock and show an error toast.
    // 500 ms and a check right after the first click: a short delay could end before the check on a busy machine.
    const { user } = renderWithProviders(<CvPreview cvId={CV_ID} />, {
      mocks: [cvPreviewMock(), { ...exportCvPdfMock(CV_ID), delay: 500 }],
    });
    await screen.findByText("Anna Kowalska");
    const button = screen.getByRole("button", { name: "EXPORT PDF" });

    await user.click(button);
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("status")).toHaveTextContent("Generating the PDF");

    await user.click(button);
    await waitFor(() => expect(saveFile).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(button).not.toHaveAttribute("aria-busy"));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows an error and keeps the preview when the PDF fails (AC-47)", async () => {
    const { user } = renderWithProviders(<CvPreview cvId={CV_ID} />, {
      mocks: [cvPreviewMock(), exportCvPdfCodeErrorMock(CV_ID, "INTERNAL_SERVER_ERROR")],
    });
    await screen.findByText("Anna Kowalska");

    await user.click(screen.getByRole("button", { name: "EXPORT PDF" }));

    expect(await screen.findByText("Could not export the PDF")).toBeInTheDocument();
    expect(saveFile).not.toHaveBeenCalled();
    expect(screen.getByText("Anna Kowalska")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "EXPORT PDF" })).toBeEnabled();
  });
});
