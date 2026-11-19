import { afterEach, describe, expect, it, vi } from "vitest";
import { base64ToPdfBlob, saveFile } from "./downloadPdf";

describe("base64ToPdfBlob", () => {
  it("decodes the text into a PDF file with the same bytes", async () => {
    const blob = base64ToPdfBlob(btoa("%PDF-1.7 test"));

    expect(blob.type).toBe("application/pdf");
    expect(await blob.text()).toBe("%PDF-1.7 test");
  });

  it("throws for text that is not base64", () => {
    expect(() => base64ToPdfBlob("***not base64***")).toThrow();
  });
});

describe("saveFile", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("clicks a download link with the file name, removes it and frees the address later", () => {
    vi.useFakeTimers();
    const createObjectURL = vi.fn(() => "blob:cv");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
    // The link is read inside the click, because `saveFile` removes it from the page right after.
    const clicked: { download: string; href: string }[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicked.push({ download: this.download, href: this.href });
    });

    saveFile(new Blob(["x"]), "my-cv.pdf");

    expect(clicked).toEqual([{ download: "my-cv.pdf", href: "blob:cv" }]);
    expect(document.querySelector("a[download]")).toBeNull();
    expect(revokeObjectURL).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:cv");
    vi.unstubAllGlobals();
  });
});
