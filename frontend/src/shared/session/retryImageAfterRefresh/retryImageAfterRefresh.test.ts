import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { refreshSession } from "../refreshSession";
import { retryImageAfterRefresh } from "./retryImageAfterRefresh";

vi.mock("../refreshSession", () => ({ refreshSession: vi.fn() }));

function mockImageStatus(status: number) {
  const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  vi.mocked(refreshSession).mockResolvedValue("refreshed");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("retryImageAfterRefresh", () => {
  it("asks the image URL for its status with HEAD", async () => {
    const fetchMock = mockImageStatus(401);

    await retryImageAfterRefresh("/api/users/1/avatar?v=1");

    expect(fetchMock).toHaveBeenCalledWith("/api/users/1/avatar?v=1", { method: "HEAD" });
  });

  it("refreshes the session on 401 and allows a new try", async () => {
    mockImageStatus(401);

    expect(await retryImageAfterRefresh("/a.png")).toBe(true);
    expect(refreshSession).toHaveBeenCalledTimes(1);
  });

  it.each(["rejected", "failed"] as const)(
    "allows no new try when the refresh is %s",
    async (outcome) => {
      mockImageStatus(401);
      vi.mocked(refreshSession).mockResolvedValue(outcome);

      expect(await retryImageAfterRefresh("/a.png")).toBe(false);
    },
  );

  it.each([200, 404, 500])("does not refresh on status %i", async (status) => {
    mockImageStatus(status);

    expect(await retryImageAfterRefresh("/a.png")).toBe(false);
    expect(refreshSession).not.toHaveBeenCalled();
  });

  it("does not refresh when the server cannot be reached", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    expect(await retryImageAfterRefresh("/a.png")).toBe(false);
    expect(refreshSession).not.toHaveBeenCalled();
  });
});
