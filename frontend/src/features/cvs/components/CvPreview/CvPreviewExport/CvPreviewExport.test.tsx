import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen, waitFor } from "@/shared/testing";
import {
  exportCvPdfCodeErrorMock,
  exportCvPdfMock,
  exportCvPdfSample,
} from "../../../useExportCvPdf/exportCvPdf.mocks";
import { CvPreviewExport } from "./CvPreviewExport";

// The download needs a real browser. The test checks that it is asked for, with the file of the backend.
const saveFile = vi.hoisted(() => vi.fn());
vi.mock("../../../utils", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../utils")>()),
  saveFile,
}));

const CV_ID = "cv-1";

describe("CvPreviewExport", () => {
  beforeEach(() => saveFile.mockClear());

  it("shows the EXPORT PDF button (AC-20)", () => {
    renderWithProviders(<CvPreviewExport cvId={CV_ID} disabled={false} />);

    expect(screen.getByRole("button", { name: "EXPORT PDF" })).toBeEnabled();
  });

  it("is disabled while the preview data is missing, and makes no request (AC-26, AC-48)", async () => {
    // No mock: a request would fail and show a toast.
    const { user } = renderWithProviders(<CvPreviewExport cvId={CV_ID} disabled />);

    const button = screen.getByRole("button", { name: "EXPORT PDF" });
    expect(button).toBeDisabled();
    await user.click(button);

    expect(saveFile).not.toHaveBeenCalled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("saves the PDF of the backend after a click (AC-20, AC-22)", async () => {
    const { user } = renderWithProviders(<CvPreviewExport cvId={CV_ID} disabled={false} />, {
      mocks: [exportCvPdfMock(CV_ID)],
    });

    await user.click(screen.getByRole("button", { name: "EXPORT PDF" }));

    await waitFor(() => expect(saveFile).toHaveBeenCalledTimes(1));
    expect(saveFile.mock.calls[0]?.[1]).toBe(exportCvPdfSample.fileName);
  });

  it("shows a loading state and ignores a second click while the PDF is made (AC-27, AC-28)", async () => {
    // One mock only: a second request would find no mock and show an error toast.
    // 500 ms and a check right after the first click: a short delay could end before the check on a busy machine.
    const { user } = renderWithProviders(<CvPreviewExport cvId={CV_ID} disabled={false} />, {
      mocks: [{ ...exportCvPdfMock(CV_ID), delay: 500 }],
    });
    const button = screen.getByRole("button", { name: "EXPORT PDF" });

    await user.click(button);
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("status")).toHaveTextContent("Generating the PDF");

    await user.click(button);
    await waitFor(() => expect(saveFile).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(button).not.toHaveAttribute("aria-busy"));
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows an error and stays on the page when the PDF fails (AC-47)", async () => {
    const { user } = renderWithProviders(<CvPreviewExport cvId={CV_ID} disabled={false} />, {
      mocks: [exportCvPdfCodeErrorMock(CV_ID, "INTERNAL_SERVER_ERROR")],
    });

    await user.click(screen.getByRole("button", { name: "EXPORT PDF" }));

    expect(await screen.findByText("Could not export the PDF")).toBeInTheDocument();
    expect(saveFile).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "EXPORT PDF" })).toBeEnabled();
  });
});
