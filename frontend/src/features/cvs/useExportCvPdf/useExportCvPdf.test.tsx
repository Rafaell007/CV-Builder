import { act, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen, type RenderWithProvidersOptions } from "@/shared/testing";
import {
  exportCvPdfCodeErrorMock,
  exportCvPdfErrorMock,
  exportCvPdfMock,
  exportCvPdfSample,
} from "./exportCvPdf.mocks";
import { useExportCvPdf } from "./useExportCvPdf";

// The download itself needs a real browser. The test checks what the hook gives to it.
const saveFile = vi.hoisted(() => vi.fn());
vi.mock("../utils", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../utils")>()),
  saveFile,
}));

const CV_ID = "cv-1";

function setup(options: RenderWithProvidersOptions) {
  let current!: ReturnType<typeof useExportCvPdf>;
  function Probe(): ReactNode {
    current = useExportCvPdf(CV_ID);
    return null;
  }
  renderWithProviders(<Probe />, options);
  return { result: () => current };
}

describe("useExportCvPdf", () => {
  beforeEach(() => saveFile.mockClear());

  it("is idle at first", () => {
    const { result } = setup({ mocks: [exportCvPdfMock(CV_ID)] });

    expect(result().exporting).toBe(false);
    expect(saveFile).not.toHaveBeenCalled();
  });

  it("asks the backend, then saves the file with the name of the backend (AC-20, AC-22)", async () => {
    // 500 ms and a check right after the start: a short delay could end before the check on a busy machine.
    const { result } = setup({ mocks: [{ ...exportCvPdfMock(CV_ID), delay: 500 }] });

    let pending!: Promise<void>;
    act(() => {
      pending = result().exportPdf();
    });
    expect(result().exporting).toBe(true);
    expect(saveFile).not.toHaveBeenCalled();
    await act(() => pending);

    expect(result().exporting).toBe(false);
    expect(saveFile).toHaveBeenCalledTimes(1);
    const [file, fileName] = saveFile.mock.calls[0] as [Blob, string];
    expect(fileName).toBe(exportCvPdfSample.fileName);
    expect(file.type).toBe("application/pdf");
    expect(await file.text()).toBe("%PDF-1.7 mock");
  });

  it("sends one request when the button is used twice at once (AC-28)", async () => {
    // One mock only: a second request would find no mock and fail.
    const { result } = setup({ mocks: [exportCvPdfMock(CV_ID)] });

    await act(async () => {
      await Promise.all([result().exportPdf(), result().exportPdf()]);
    });

    expect(saveFile).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows an error toast and saves no file when the request fails (AC-47)", async () => {
    const { result } = setup({ mocks: [exportCvPdfErrorMock(CV_ID)] });

    await act(() => result().exportPdf());

    expect(saveFile).not.toHaveBeenCalled();
    expect(await screen.findByText("Could not export the PDF")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong. Please try again.")).toBeInTheDocument();
    expect(result().exporting).toBe(false);
  });

  it("says that the CV is not available for NOT_FOUND", async () => {
    const { result } = setup({ mocks: [exportCvPdfCodeErrorMock(CV_ID, "NOT_FOUND")] });

    await act(() => result().exportPdf());

    expect(
      await screen.findByText("This CV does not exist, or you cannot open it."),
    ).toBeInTheDocument();
    expect(saveFile).not.toHaveBeenCalled();
  });

  it("does not show backend details for a server error", async () => {
    const { result } = setup({
      mocks: [exportCvPdfCodeErrorMock(CV_ID, "INTERNAL_SERVER_ERROR")],
    });

    await act(() => result().exportPdf());

    expect(await screen.findByText("Something went wrong. Please try again.")).toBeInTheDocument();
    expect(screen.queryByText("INTERNAL_SERVER_ERROR")).not.toBeInTheDocument();
  });

  it("can export again after a failure", async () => {
    const { result } = setup({ mocks: [exportCvPdfErrorMock(CV_ID), exportCvPdfMock(CV_ID)] });
    await act(() => result().exportPdf());
    await waitFor(() => expect(result().exporting).toBe(false));

    await act(() => result().exportPdf());

    expect(saveFile).toHaveBeenCalledTimes(1);
  });

  it("shows an error toast when the file text cannot be decoded", async () => {
    const broken = { ...exportCvPdfSample, base64: "***" };
    const { result } = setup({ mocks: [exportCvPdfMock(CV_ID, broken)] });

    await act(() => result().exportPdf());

    expect(saveFile).not.toHaveBeenCalled();
    expect(await screen.findByText("Could not export the PDF")).toBeInTheDocument();
  });
});
