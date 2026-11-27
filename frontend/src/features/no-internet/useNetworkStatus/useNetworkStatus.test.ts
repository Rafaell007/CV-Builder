import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { clearQueryFailed, markQueryFailed } from "@/shared/network";
import { useNetworkStatus } from "./useNetworkStatus";

// Sets what the browser reports as its connection.
function stubOnline(online: boolean) {
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(online);
}

afterEach(() => {
  clearQueryFailed();
  vi.restoreAllMocks();
});

describe("useNetworkStatus", () => {
  it("is online by default", () => {
    stubOnline(true);

    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current).toBe("online");
  });

  it("re-renders when the browser goes offline and back online", () => {
    stubOnline(true);
    const { result } = renderHook(() => useNetworkStatus());

    act(() => {
      stubOnline(false);
      window.dispatchEvent(new Event("offline"));
    });
    expect(result.current).toBe("offline");

    act(() => {
      stubOnline(true);
      window.dispatchEvent(new Event("online"));
    });
    expect(result.current).toBe("online");
  });

  it("re-renders when a query fails and when the failure is cleared", () => {
    stubOnline(true);
    const { result } = renderHook(() => useNetworkStatus());

    act(() => markQueryFailed());
    expect(result.current).toBe("queryFailed");

    act(() => clearQueryFailed());
    expect(result.current).toBe("online");
  });
});
