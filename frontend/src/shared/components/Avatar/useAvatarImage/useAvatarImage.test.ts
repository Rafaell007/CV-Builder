import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useAvatarImage } from "./useAvatarImage";

describe("useAvatarImage", () => {
  it("shows the image when there is a src", () => {
    const { result } = renderHook(() => useAvatarImage("/a.png"));

    expect(result.current.showImage).toBe(true);
  });

  it("hides the image when there is no src", () => {
    const { result } = renderHook(() => useAvatarImage(null));

    expect(result.current.showImage).toBe(false);
  });

  it("hides the image after a load error", () => {
    const { result } = renderHook(() => useAvatarImage("/a.png"));

    act(() => result.current.onError());

    expect(result.current.showImage).toBe(false);
  });

  it("tries again when the src changes", () => {
    const { result, rerender } = renderHook(({ src }) => useAvatarImage(src), {
      initialProps: { src: "/a.png" },
    });
    act(() => result.current.onError());

    rerender({ src: "/b.png" });

    expect(result.current.showImage).toBe(true);
  });
});
