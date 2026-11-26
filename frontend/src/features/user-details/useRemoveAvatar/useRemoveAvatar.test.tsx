import { gql, type ApolloClient } from "@apollo/client";
import { useApolloClient, useQuery } from "@apollo/client/react";
import type { MockLink } from "@apollo/client/testing";
import { act, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UserDocument } from "@/shared/graphql";
import { renderWithProviders } from "@/shared/testing";
import { userMock } from "../user-details.mocks";
import { useRemoveAvatar } from "./useRemoveAvatar";

// The 401 → refresh → retry rules are tested once, in `avatarRequest.test.ts`.
const session = vi.hoisted(() => ({ refreshSession: vi.fn(), redirectToSignIn: vi.fn() }));
vi.mock("@/shared/session", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  ...session,
}));

const OLD_AVATAR_URL = "/api/users/7/avatar?v=1";

// A stored Users list. Only its field name matters here: the hook removes every stored `users` result.
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

// The Profile tab has the `User` query open with a photo; the reload after the removal answers without one.
async function setup() {
  let current!: { client: ApolloClient; hook: ReturnType<typeof useRemoveAvatar> };
  function Probe(): ReactNode {
    useQuery(UserDocument, { variables: { id: "7" } });
    current = { client: useApolloClient(), hook: useRemoveAvatar("7") };
    return null;
  }
  renderWithProviders(<Probe />, {
    mocks: [withAvatarUrl(userMock("7"), OLD_AVATAR_URL), withAvatarUrl(userMock("7"), null)],
  });
  const cachedAvatarUrl = () =>
    current.client.cache.readQuery({ query: UserDocument, variables: { id: "7" } })?.user.avatarUrl;
  await waitFor(() => expect(cachedAvatarUrl()).toBe(OLD_AVATAR_URL));
  current.client.cache.writeQuery({
    query: STORED_USERS,
    data: { users: { __typename: "UserPage", total: 1 } },
  });

  return {
    remove: async () => {
      let outcome;
      await act(async () => {
        outcome = await current.hook.remove();
      });
      return outcome;
    },
    pending: () => current.hook.pending,
    startRemove: () => current.hook.remove(),
    cachedAvatarUrl,
    hasStoredUsers: () => current.client.cache.readQuery({ query: STORED_USERS }) !== null,
  };
}

describe("useRemoveAvatar", () => {
  it("sends DELETE without a body to the user's avatar endpoint", async () => {
    fetchMock.mockResolvedValue(answer(204));
    const { remove } = await setup();

    await remove();

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/api/users/7/avatar");
    expect(init?.method).toBe("DELETE");
    expect(init?.body).toBeNull();
  });

  it("resolves 'removed', loads the user again without avatarUrl and removes the stored Users lists", async () => {
    fetchMock.mockResolvedValue(answer(204));
    const { remove, cachedAvatarUrl, hasStoredUsers } = await setup();

    expect(await remove()).toBe("removed");

    expect(cachedAvatarUrl()).toBeNull();
    expect(hasStoredUsers()).toBe(false);
  });

  it.each([
    [403, "forbidden"],
    [404, "failed"],
    [500, "failed"],
  ])("maps the answer %i to '%s' and keeps the photo", async (status, outcome) => {
    fetchMock.mockResolvedValue(answer(status));
    const { remove, cachedAvatarUrl, hasStoredUsers } = await setup();

    expect(await remove()).toBe(outcome);

    expect(cachedAvatarUrl()).toBe(OLD_AVATAR_URL);
    expect(hasStoredUsers()).toBe(true);
  });

  it("resolves 'failed' when there is no answer (offline)", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    const { remove } = await setup();

    expect(await remove()).toBe("failed");
  });

  it("is pending while the request runs", async () => {
    let finish!: (response: Response) => void;
    fetchMock.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    const { pending, startRemove } = await setup();

    let done!: Promise<unknown>;
    act(() => {
      done = startRemove();
    });
    await waitFor(() => expect(pending()).toBe(true));

    await act(async () => {
      finish(answer(204));
      await done;
    });
    expect(pending()).toBe(false);
  });

  it("stays pending and never settles when the session is over", async () => {
    fetchMock.mockResolvedValue(answer(401));
    session.refreshSession.mockResolvedValue("rejected");
    const { pending, startRemove } = await setup();

    let settled = false;
    act(() => {
      void startRemove().finally(() => (settled = true));
    });

    await waitFor(() => expect(session.redirectToSignIn).toHaveBeenCalledOnce());
    expect(settled).toBe(false);
    expect(pending()).toBe(true);
  });
});
