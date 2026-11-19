import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useSaveFile } from "./useSaveFile";

describe("useSaveFile", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("clicks a download link with the file name, removes it and frees the address later", () => {
    vi.useFakeTimers();
    const createObjectURL = vi.fn(() => "blob:cv");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
    // The link is read inside the click, because the hook removes it from the page right after.
    const clicked: { download: string; href: string }[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicked.push({ download: this.download, href: this.href });
    });
    const { result } = renderHook(() => useSaveFile());

    result.current(new Blob(["x"]), "my-cv.pdf");

    expect(clicked).toEqual([{ download: "my-cv.pdf", href: "blob:cv" }]);
    expect(document.querySelector("a[download]")).toBeNull();
    expect(revokeObjectURL).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:cv");
  });

  it("returns the same function on every render", () => {
    const { result, rerender } = renderHook(() => useSaveFile());
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });
});
