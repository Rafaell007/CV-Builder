import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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

  describe("with retryImage", () => {
    it("loads the image again when retryImage allows it", async () => {
      const retryImage = vi.fn().mockResolvedValue(true);
      const { result } = renderHook(() => useAvatarImage("/a.png", retryImage));
      const firstKey = result.current.imageKey;

      await act(async () => result.current.onError());

      expect(retryImage).toHaveBeenCalledWith("/a.png");
      expect(result.current.showImage).toBe(true);
      expect(result.current.imageKey).not.toBe(firstKey);
    });

    it("shows the initials when retryImage says no", async () => {
      const retryImage = vi.fn().mockResolvedValue(false);
      const { result } = renderHook(() => useAvatarImage("/a.png", retryImage));

      await act(async () => result.current.onError());

      expect(result.current.showImage).toBe(false);
    });

    it("asks only once per src: a second failure shows the initials", async () => {
      const retryImage = vi.fn().mockResolvedValue(true);
      const { result } = renderHook(() => useAvatarImage("/a.png", retryImage));
      await act(async () => result.current.onError());

      await act(async () => result.current.onError());

      expect(retryImage).toHaveBeenCalledTimes(1);
      expect(result.current.showImage).toBe(false);
    });

    it("asks again for a new src", async () => {
      const retryImage = vi.fn().mockResolvedValue(true);
      const { result, rerender } = renderHook(({ src }) => useAvatarImage(src, retryImage), {
        initialProps: { src: "/a.png" },
      });
      await act(async () => result.current.onError());

      rerender({ src: "/b.png" });
      await act(async () => result.current.onError());

      expect(retryImage).toHaveBeenLastCalledWith("/b.png");
      expect(retryImage).toHaveBeenCalledTimes(2);
    });
  });
});
