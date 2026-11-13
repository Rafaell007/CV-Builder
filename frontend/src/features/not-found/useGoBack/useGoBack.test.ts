import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useGoBack } from "./useGoBack";

const back = vi.fn();
const push = vi.fn();
// The code under test only calls back and push.
vi.mock("next/navigation", () => ({ useRouter: () => ({ back, push }) }));

// Sets how many pages the tab's history holds.
function stubHistoryLength(length: number) {
  vi.spyOn(window.history, "length", "get").mockReturnValue(length);
}

afterEach(() => {
  vi.restoreAllMocks();
  back.mockClear();
  push.mockClear();
});

describe("useGoBack", () => {
  it("goes to the previous page when the tab has one", () => {
    stubHistoryLength(3);

    renderHook(() => useGoBack()).result.current();

    expect(back).toHaveBeenCalledTimes(1);
    expect(push).not.toHaveBeenCalled();
  });

  it("goes to the start page when the 404 is the first page in the tab", () => {
    stubHistoryLength(1);

    renderHook(() => useGoBack()).result.current();

    expect(push).toHaveBeenCalledWith("/");
    expect(back).not.toHaveBeenCalled();
  });
});
