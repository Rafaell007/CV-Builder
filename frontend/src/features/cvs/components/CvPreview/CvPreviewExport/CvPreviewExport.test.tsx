import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen } from "@/shared/testing";
import { CvPreviewExport } from "./CvPreviewExport";

describe("CvPreviewExport", () => {
  it("shows the EXPORT PDF button (AC-20)", () => {
    renderWithProviders(<CvPreviewExport disabled={false} exporting={false} onExport={vi.fn()} />);

    expect(screen.getByRole("button", { name: "EXPORT PDF" })).toBeEnabled();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("calls onExport after a click", async () => {
    const onExport = vi.fn();
    const { user } = renderWithProviders(
      <CvPreviewExport disabled={false} exporting={false} onExport={onExport} />,
    );

    await user.click(screen.getByRole("button", { name: "EXPORT PDF" }));

    expect(onExport).toHaveBeenCalledTimes(1);
  });

  it("is disabled while the preview data is missing, and does not call onExport (AC-26, AC-48)", async () => {
    const onExport = vi.fn();
    const { user } = renderWithProviders(
      <CvPreviewExport disabled exporting={false} onExport={onExport} />,
    );

    const button = screen.getByRole("button", { name: "EXPORT PDF" });
    expect(button).toBeDisabled();
    await user.click(button);

    expect(onExport).not.toHaveBeenCalled();
  });

  it("shows a loading state and tells screen readers while the PDF is made (AC-27)", () => {
    renderWithProviders(<CvPreviewExport disabled={false} exporting onExport={vi.fn()} />);

    expect(screen.getByRole("button", { name: "EXPORT PDF" })).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("status")).toHaveTextContent("Generating the PDF");
  });
});
