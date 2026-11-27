import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { requestAvatar } from "./avatarRequest.browser";

const session = vi.hoisted(() => ({ refreshSession: vi.fn(), redirectToSignIn: vi.fn() }));
vi.mock("@/shared/session", () => session);

const fetchMock = vi.fn<typeof fetch>();
const answer = (status: number) => new Response(null, { status });
const png = () => new File([new Uint8Array(10)], "photo.png", { type: "image/png" });

/** Whether a promise has settled after the queued work ran. */
async function hasSettled(promise: Promise<unknown>): Promise<boolean> {
  let settled = false;
  void promise.finally(() => (settled = true));
  await vi.waitFor(() => expect(session.redirectToSignIn).toHaveBeenCalled());
  await Promise.resolve();
  return settled;
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  session.redirectToSignIn.mockReturnValue(true);
});

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
  session.refreshSession.mockReset();
  session.redirectToSignIn.mockReset();
});

describe("requestAvatar", () => {
  it("POSTs the file as multipart to the user's avatar endpoint", async () => {
    fetchMock.mockResolvedValue(answer(204));
    const file = png();

    expect(await requestAvatar("7", "POST", file)).toBe(204);

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/api/users/7/avatar");
    expect(init?.method).toBe("POST");
    expect((init?.body as FormData).get("file")).toBe(file);
    // The browser must set the multipart boundary itself.
    expect(init?.headers).toBeUndefined();
  });

  it("sends DELETE without a body", async () => {
    fetchMock.mockResolvedValue(answer(204));

    expect(await requestAvatar("7", "DELETE")).toBe(204);

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/api/users/7/avatar");
    expect(init).toMatchObject({ method: "DELETE", body: null });
  });

  it("encodes the user id in the path", async () => {
    fetchMock.mockResolvedValue(answer(400));

    await requestAvatar("a/b", "DELETE");

    expect(fetchMock.mock.calls[0]![0]).toBe("/api/users/a%2Fb/avatar");
  });

  it("resolves with the status of an error answer, without a refresh", async () => {
    fetchMock.mockResolvedValue(answer(403));

    expect(await requestAvatar("7", "DELETE")).toBe(403);
    expect(session.refreshSession).not.toHaveBeenCalled();
  });

  it("resolves null when there is no answer (offline)", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    expect(await requestAvatar("7", "POST", png())).toBeNull();
  });

  describe("expired access token (401)", () => {
    it("refreshes the session and sends the request once more, with the file again", async () => {
      fetchMock.mockResolvedValueOnce(answer(401)).mockResolvedValueOnce(answer(204));
      session.refreshSession.mockResolvedValue("refreshed");
      const file = png();

      expect(await requestAvatar("7", "POST", file)).toBe(204);

      expect(fetchMock).toHaveBeenCalledTimes(2);
      const retryBody = fetchMock.mock.calls[1]![1]?.body as FormData;
      expect(retryBody).not.toBe(fetchMock.mock.calls[0]![1]?.body);
      expect(retryBody.get("file")).toBe(file);
      expect(session.redirectToSignIn).not.toHaveBeenCalled();
    });

    it.each([
      ["the refresh is refused", "rejected", [401]],
      ["the second try is 401 again", "refreshed", [401, 401]],
    ])("goes to sign-in and never settles when %s", async (_, refresh, statuses) => {
      for (const status of statuses) fetchMock.mockResolvedValueOnce(answer(status));
      session.refreshSession.mockResolvedValue(refresh);

      expect(await hasSettled(requestAvatar("7", "DELETE"))).toBe(false);
      expect(session.redirectToSignIn).toHaveBeenCalledOnce();
    });

    it("resolves 401 when there is nowhere to redirect to (already on sign-in)", async () => {
      fetchMock.mockResolvedValue(answer(401));
      session.refreshSession.mockResolvedValue("rejected");
      session.redirectToSignIn.mockReturnValue(false);

      expect(await requestAvatar("7", "DELETE")).toBe(401);
    });

    it("resolves 401 and stays signed in when the refresh gets no answer", async () => {
      fetchMock.mockResolvedValue(answer(401));
      session.refreshSession.mockResolvedValue("failed");

      expect(await requestAvatar("7", "DELETE")).toBe(401);
      expect(fetchMock).toHaveBeenCalledOnce();
      expect(session.redirectToSignIn).not.toHaveBeenCalled();
    });
  });
});
