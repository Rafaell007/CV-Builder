import { gql, type ApolloClient } from "@apollo/client";
import { useApolloClient, useQuery } from "@apollo/client/react";
import type { MockLink } from "@apollo/client/testing";
import { act, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UserDocument } from "@/shared/graphql";
import { renderWithProviders } from "@/shared/testing";
import { AVATAR_MAX_BYTES } from "../user-details.constants";
import { userMock } from "../user-details.mocks";
import { useUploadAvatar } from "./useUploadAvatar";

const session = vi.hoisted(() => ({ refreshSession: vi.fn(), redirectToSignIn: vi.fn() }));
vi.mock("@/shared/session", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  ...session,
}));

const NEW_AVATAR_URL = "/api/users/7/avatar?v=1";

// A stored Users list. Only its field name matters here: the hook removes every stored `users` result.
const STORED_USERS = gql`
  query StoredUsers {
    users {
      total
    }
  }
`;

/** The same `user` answer, now with an avatar: what the backend sends when the page loads the user again. */
function withAvatar(mock: MockLink.MockedResponse): MockLink.MockedResponse {
  const { data } = mock.result as { data: { user: Record<string, unknown> } };
  return { ...mock, result: { data: { user: { ...data.user, avatarUrl: NEW_AVATAR_URL } } } };
}

const png = () => new File([new Uint8Array(10)], "photo.png", { type: "image/png" });
const answer = (status: number) => new Response(null, { status });

const fetchMock = vi.fn<typeof fetch>();

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

// The Profile tab has the `User` query open (preloaded on the server), so a reload after the upload updates it.
async function setup() {
  let current!: { client: ApolloClient; hook: ReturnType<typeof useUploadAvatar> };
  function Probe(): ReactNode {
    useQuery(UserDocument, { variables: { id: "7" } });
    current = { client: useApolloClient(), hook: useUploadAvatar("7") };
    return null;
  }
  renderWithProviders(<Probe />, { mocks: [userMock("7"), withAvatar(userMock("7"))] });
  const cachedAvatarUrl = () =>
    current.client.cache.readQuery({ query: UserDocument, variables: { id: "7" } })?.user.avatarUrl;
  await waitFor(() => expect(cachedAvatarUrl()).toBeNull());
  current.client.cache.writeQuery({
    query: STORED_USERS,
    data: { users: { __typename: "UserPage", total: 1 } },
  });

  return {
    upload: async (file: File) => {
      let outcome;
      await act(async () => {
        outcome = await current.hook.upload(file);
      });
      return outcome;
    },
    pending: () => current.hook.pending,
    startUpload: (file: File) => current.hook.upload(file),
    cachedAvatarUrl,
    hasStoredUsers: () => current.client.cache.readQuery({ query: STORED_USERS }) !== null,
  };
}

describe("useUploadAvatar", () => {
  it("sends the file as multipart to the user's avatar endpoint", async () => {
    fetchMock.mockResolvedValue(answer(204));
    const { upload } = await setup();
    const file = png();

    await upload(file);

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/api/users/7/avatar");
    expect(init?.method).toBe("POST");
    expect((init?.body as FormData).get("file")).toBe(file);
    // The browser must set the multipart boundary itself.
    expect(init?.headers).toBeUndefined();
  });

  it("resolves 'uploaded', loads the user again for the new avatarUrl and removes the stored Users lists", async () => {
    fetchMock.mockResolvedValue(answer(204));
    const { upload, cachedAvatarUrl, hasStoredUsers } = await setup();

    expect(await upload(png())).toBe("uploaded");

    expect(cachedAvatarUrl()).toBe(NEW_AVATAR_URL);
    expect(hasStoredUsers()).toBe(false);
  });

  it("refuses a wrong type at once, without a request", async () => {
    const { upload } = await setup();
    const text = new File(["hello"], "notes.txt", { type: "text/plain" });

    expect(await upload(text)).toBe("wrongType");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses a file over 5 MB at once, without a request", async () => {
    const { upload } = await setup();
    const big = new File([new Uint8Array(AVATAR_MAX_BYTES + 1)], "big.png", { type: "image/png" });

    expect(await upload(big)).toBe("tooLarge");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    [413, "tooLarge"],
    [415, "wrongType"],
    [403, "forbidden"],
    [400, "failed"],
    [500, "failed"],
  ])("maps the answer %i to '%s' and keeps the old avatar (AC-23)", async (status, outcome) => {
    fetchMock.mockResolvedValue(answer(status));
    const { upload, cachedAvatarUrl, hasStoredUsers } = await setup();

    expect(await upload(png())).toBe(outcome);

    expect(cachedAvatarUrl()).toBeNull();
    expect(hasStoredUsers()).toBe(true);
  });

  it("resolves 'failed' when there is no answer (offline)", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    const { upload } = await setup();

    expect(await upload(png())).toBe("failed");
  });

  it("is pending while the request runs", async () => {
    let finish!: (response: Response) => void;
    fetchMock.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    const { pending, startUpload } = await setup();

    let done!: Promise<unknown>;
    act(() => {
      done = startUpload(png());
    });
    await waitFor(() => expect(pending()).toBe(true));

    await act(async () => {
      finish(answer(204));
      await done;
    });
    expect(pending()).toBe(false);
  });

  describe("expired access token (401)", () => {
    it("refreshes the session and sends the file once more", async () => {
      fetchMock.mockResolvedValueOnce(answer(401)).mockResolvedValueOnce(answer(204));
      session.refreshSession.mockResolvedValue("refreshed");
      const { upload } = await setup();

      expect(await upload(png())).toBe("uploaded");
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(session.redirectToSignIn).not.toHaveBeenCalled();
    });

    it.each([
      ["the refresh is refused", "rejected", [401]],
      ["the second try is 401 again", "refreshed", [401, 401]],
    ])("goes to sign-in and never settles when %s", async (_, refresh, statuses) => {
      for (const status of statuses) fetchMock.mockResolvedValueOnce(answer(status));
      session.refreshSession.mockResolvedValue(refresh);
      const { pending, startUpload } = await setup();

      let settled = false;
      act(() => {
        void startUpload(png()).finally(() => (settled = true));
      });

      await waitFor(() => expect(session.redirectToSignIn).toHaveBeenCalledOnce());
      expect(settled).toBe(false);
      expect(pending()).toBe(true);
    });

    it("resolves 'failed' and stays signed in when the refresh gets no answer", async () => {
      fetchMock.mockResolvedValue(answer(401));
      session.refreshSession.mockResolvedValue("failed");
      const { upload } = await setup();

      expect(await upload(png())).toBe("failed");
      expect(fetchMock).toHaveBeenCalledOnce();
      expect(session.redirectToSignIn).not.toHaveBeenCalled();
    });
  });
});
