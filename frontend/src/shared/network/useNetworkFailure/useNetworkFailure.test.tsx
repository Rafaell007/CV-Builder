import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { reportRequestFailure, resetNetworkStatus } from "../store";
import { useNetworkFailure } from "./useNetworkFailure";

afterEach(() => {
  resetNetworkStatus();
});

describe("useNetworkFailure", () => {
  it("is false at first and turns true when a request fails", () => {
    const { result } = renderHook(() => useNetworkFailure());
    expect(result.current).toBe(false);

    act(() => reportRequestFailure());

    expect(result.current).toBe(true);
  });

  it("turns true when the browser goes offline", () => {
    const { result } = renderHook(() => useNetworkFailure());

    act(() => {
      window.dispatchEvent(new Event("offline"));
    });

    expect(result.current).toBe(true);
  });
});
