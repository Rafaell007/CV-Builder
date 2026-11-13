import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearQueryFailed, getSnapshot, markQueryFailed } from "@/shared/network";
import { useClearQueryFailed } from "./useClearQueryFailed";

beforeEach(() => {
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
  markQueryFailed();
});

afterEach(() => {
  clearQueryFailed();
  vi.restoreAllMocks();
});

describe("useClearQueryFailed", () => {
  it("clears the failed query flag when it mounts", () => {
    expect(getSnapshot()).toBe("queryFailed");

    renderHook(() => useClearQueryFailed());

    expect(getSnapshot()).toBe("online");
  });

  it("does not hide the offline state", () => {
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);

    renderHook(() => useClearQueryFailed());

    expect(getSnapshot()).toBe("offline");
  });
});
