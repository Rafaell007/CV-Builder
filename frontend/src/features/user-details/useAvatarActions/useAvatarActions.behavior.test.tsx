import { gql, type ApolloClient } from "@apollo/client";
import { useApolloClient, useQuery } from "@apollo/client/react";
import type { MockLink } from "@apollo/client/testing";
import { act, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UserDocument } from "@/shared/graphql";
import { renderWithProviders } from "@/shared/testing";
import { AVATAR_MAX_BYTES } from "../user-details.constants";
import { userMock } from "../user-details.mocks";
import { useAvatarActions } from "./useAvatarActions";

// The avatar actions through their public result, with the real requests (a stubbed `fetch`), the real Apollo cache
// and the real toasts. The 401 → refresh → retry rules of the request itself are tested in `avatarRequest.test.ts`.
const session = vi.hoisted(() => ({ refreshSession: vi.fn(), redirectToSignIn: vi.fn() }));
vi.mock("@/shared/session", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  ...session,
}));

const OLD_AVATAR_URL = "/api/users/7/avatar?v=1";
const NEW_AVATAR_URL = "/api/users/7/avatar?v=2";

// A stored Users list. Only its field name matters here: a successful action removes every stored `users` result.
const STORED_USERS = gql`
  query StoredUsers {
    users {
      total
    }
  }
`;

/** The same `user` answer, with the given `avatarUrl`. */
function withAvatarUrl(
  mock: MockLink.MockedResponse,
  avatarUrl: string | null,
): MockLink.MockedResponse {
  const { data } = mock.result as { data: { user: Record<string, unknown> } };
  return { ...mock, result: { data: { user: { ...data.user, avatarUrl } } } };
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

// The Profile tab has the `User` query open (preloaded on the server), so a reload after an action updates it.
async function setup(before: string | null, after: string | null, locale: "en" | "pl" = "en") {
  let current!: { client: ApolloClient; hook: ReturnType<typeof useAvatarActions> };
  function Probe(): ReactNode {
    useQuery(UserDocument, { variables: { id: "7" } });
    current = { client: useApolloClient(), hook: useAvatarActions("7") };
    return null;
  }
  renderWithProviders(<Probe />, {
    mocks: [withAvatarUrl(userMock("7"), before), withAvatarUrl(userMock("7"), after)],
    locale,
  });
  const cachedAvatarUrl = () =>
    current.client.cache.readQuery({ query: UserDocument, variables: { id: "7" } })?.user.avatarUrl;
  await waitFor(() => expect(cachedAvatarUrl()).toBe(before));
  current.client.cache.writeQuery({
    query: STORED_USERS,
    data: { users: { __typename: "UserPage", total: 1 } },
  });

  return {
    hook: () => current.hook,
    upload: (file: File) => act(() => current.hook.upload(file)),
    remove: () => act(() => current.hook.remove()),
    cachedAvatarUrl,
    hasStoredUsers: () => current.client.cache.readQuery({ query: STORED_USERS }) !== null,
  };
}

const setupUpload = () => setup(null, NEW_AVATAR_URL);
const setupRemove = () => setup(OLD_AVATAR_URL, null);

describe("useAvatarActions: upload", () => {
  it("sends the file as multipart to the user's avatar endpoint", async () => {
    fetchMock.mockResolvedValue(answer(204));
    const { upload } = await setupUpload();
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

  it("says so, loads the user again for the new avatarUrl and removes the stored Users lists", async () => {
    fetchMock.mockResolvedValue(answer(204));
    const { upload, cachedAvatarUrl, hasStoredUsers } = await setupUpload();

    await upload(png());

    expect(await screen.findByText("Avatar updated")).toBeInTheDocument();
    expect(cachedAvatarUrl()).toBe(NEW_AVATAR_URL);
    expect(hasStoredUsers()).toBe(false);
  });

  it("refuses a wrong type at once, without a request", async () => {
    const { upload } = await setupUpload();

    await upload(new File(["hello"], "notes.txt", { type: "text/plain" }));

    expect(await screen.findByText("Failed to upload avatar")).toBeInTheDocument();
    expect(screen.getByText("Only png, jpg or gif images are allowed.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses a file over 5 MB at once, without a request", async () => {
    const { upload } = await setupUpload();

    await upload(
      new File([new Uint8Array(AVATAR_MAX_BYTES + 1)], "big.png", { type: "image/png" }),
    );

    expect(await screen.findByText("File size must not exceed 5 MB.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    [413, "File size must not exceed 5 MB."],
    [415, "Only png, jpg or gif images are allowed."],
    [403, "You do not have permission to do this."],
    [400, "Something went wrong. Try again."],
    [500, "Something went wrong. Try again."],
  ])(
    "shows the error toast for the answer %i and keeps the old avatar (AC-23)",
    async (status, reason) => {
      fetchMock.mockResolvedValue(answer(status));
      const { upload, cachedAvatarUrl, hasStoredUsers } = await setupUpload();

      await upload(png());

      expect(await screen.findByText("Failed to upload avatar")).toBeInTheDocument();
      expect(screen.getByText(reason)).toBeInTheDocument();
      expect(cachedAvatarUrl()).toBeNull();
      expect(hasStoredUsers()).toBe(true);
    },
  );

  it("shows the try again error when there is no answer (offline)", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    const { upload } = await setupUpload();

    await upload(png());

    expect(await screen.findByText("Something went wrong. Try again.")).toBeInTheDocument();
  });

  it("is busy while the request runs", async () => {
    let finish!: (response: Response) => void;
    fetchMock.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    const { hook } = await setupUpload();

    let done!: Promise<void>;
    act(() => {
      done = hook().upload(png());
    });
    await waitFor(() => expect(hook().busy).toBe(true));

    await act(async () => {
      finish(answer(204));
      await done;
    });
    expect(hook().busy).toBe(false);
  });

  it("refreshes the session and sends the file once more after a 401", async () => {
    fetchMock.mockResolvedValueOnce(answer(401)).mockResolvedValueOnce(answer(204));
    session.refreshSession.mockResolvedValue("refreshed");
    const { upload } = await setupUpload();

    await upload(png());

    expect(await screen.findByText("Avatar updated")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(session.redirectToSignIn).not.toHaveBeenCalled();
  });

  it.each([
    ["the refresh is refused", "rejected", [401]],
    ["the second try is 401 again", "refreshed", [401, 401]],
  ])("goes to sign-in, stays busy and shows no toast when %s", async (_, refresh, statuses) => {
    for (const status of statuses) fetchMock.mockResolvedValueOnce(answer(status));
    session.refreshSession.mockResolvedValue(refresh);
    const { hook } = await setupUpload();

    let settled = false;
    act(() => {
      void hook()
        .upload(png())
        .finally(() => (settled = true));
    });

    await waitFor(() => expect(session.redirectToSignIn).toHaveBeenCalledOnce());
    expect(settled).toBe(false);
    expect(hook().busy).toBe(true);
    expect(screen.queryByText("Failed to upload avatar")).not.toBeInTheDocument();
  });

  it("shows the try again error and stays signed in when the refresh gets no answer", async () => {
    fetchMock.mockResolvedValue(answer(401));
    session.refreshSession.mockResolvedValue("failed");
    const { upload } = await setupUpload();

    await upload(png());

    expect(await screen.findByText("Something went wrong. Try again.")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(session.redirectToSignIn).not.toHaveBeenCalled();
  });
});

describe("useAvatarActions: remove", () => {
  it("sends DELETE without a body to the user's avatar endpoint", async () => {
    fetchMock.mockResolvedValue(answer(204));
    const { remove } = await setupRemove();

    await remove();

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/api/users/7/avatar");
    expect(init?.method).toBe("DELETE");
    expect(init?.body).toBeNull();
  });

  it("says so, loads the user again without avatarUrl and removes the stored Users lists", async () => {
    fetchMock.mockResolvedValue(answer(204));
    const { remove, cachedAvatarUrl, hasStoredUsers } = await setupRemove();

    await remove();

    expect(await screen.findByText("Avatar removed")).toBeInTheDocument();
    expect(cachedAvatarUrl()).toBeNull();
    expect(hasStoredUsers()).toBe(false);
  });

  it.each([
    [403, "You do not have permission to do this."],
    [404, "Something went wrong. Try again."],
    [500, "Something went wrong. Try again."],
  ])("shows the error toast for the answer %i and keeps the photo", async (status, reason) => {
    fetchMock.mockResolvedValue(answer(status));
    const { remove, cachedAvatarUrl, hasStoredUsers } = await setupRemove();

    await remove();

    expect(await screen.findByText("Failed to remove avatar")).toBeInTheDocument();
    expect(screen.getByText(reason)).toBeInTheDocument();
    expect(cachedAvatarUrl()).toBe(OLD_AVATAR_URL);
    expect(hasStoredUsers()).toBe(true);
  });

  it("shows the try again error when there is no answer (offline)", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    const { remove } = await setupRemove();

    await remove();

    expect(await screen.findByText("Something went wrong. Try again.")).toBeInTheDocument();
  });

  it("is busy while the request runs", async () => {
    let finish!: (response: Response) => void;
    fetchMock.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    const { hook } = await setupRemove();

    let done!: Promise<void>;
    act(() => {
      done = hook().remove();
    });
    await waitFor(() => expect(hook().busy).toBe(true));

    await act(async () => {
      finish(answer(204));
      await done;
    });
    expect(hook().busy).toBe(false);
  });

  it("stays busy and shows no toast when the session is over", async () => {
    fetchMock.mockResolvedValue(answer(401));
    session.refreshSession.mockResolvedValue("rejected");
    const { hook } = await setupRemove();

    let settled = false;
    act(() => {
      void hook()
        .remove()
        .finally(() => (settled = true));
    });

    await waitFor(() => expect(session.redirectToSignIn).toHaveBeenCalledOnce());
    expect(settled).toBe(false);
    expect(hook().busy).toBe(true);
    expect(screen.queryByText("Failed to remove avatar")).not.toBeInTheDocument();
  });
});

describe("useAvatarActions: language", () => {
  it("speaks the language of the page", async () => {
    const { upload } = await setup(null, NEW_AVATAR_URL, "pl");

    await upload(
      new File([new Uint8Array(AVATAR_MAX_BYTES + 1)], "big.png", { type: "image/png" }),
    );

    expect(await screen.findByText("Plik nie może być większy niż 5 MB.")).toBeInTheDocument();
  });
});

describe("useAvatarActions: one action at a time", () => {
  it("ignores a second action while the first runs", async () => {
    let finish!: (response: Response) => void;
    fetchMock.mockReturnValueOnce(new Promise((resolve) => (finish = resolve)));
    const { hook } = await setupUpload();

    let first!: Promise<void>;
    act(() => {
      first = hook().upload(png());
    });
    await act(() => hook().remove());
    expect(fetchMock).toHaveBeenCalledOnce();

    await act(async () => {
      finish(answer(204));
      await first;
    });
    fetchMock.mockResolvedValueOnce(answer(204));
    await act(() => hook().remove());
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
