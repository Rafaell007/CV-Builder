import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useToast } from "./useToast";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useToast", () => {
  it("throws outside ToastProvider", () => {
    // React logs the thrown error; keep the test output clean.
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => renderHook(() => useToast())).toThrow(
      "useToast must be used inside ToastProvider",
    );
  });
});
