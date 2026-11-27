import { gql, type ApolloClient, type OperationVariables } from "@apollo/client";
import { useApolloClient } from "@apollo/client/react";
import type { MockLink } from "@apollo/client/testing";
import { act } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { MeDocument, UserDocument, type UpdateProfileInput } from "@/shared/graphql";
import { renderWithProviders } from "@/shared/testing";
import { CONCURRENT_CHANGE_REASON } from "@/shared/userProfile";
import {
  meMock,
  updateProfileMock,
  updateProfileNetworkErrorMock,
  updateProfileRefusedMock,
  userMock,
} from "../user-details.mocks";
import { useUpdateProfile } from "./useUpdateProfile";

// A stored Users list. Only its field name matters here: the hook removes every stored `users` result.
const STORED_USERS = gql`
  query StoredUsers {
    users {
      total
    }
  }
`;

const inputFor = (id: string): UpdateProfileInput => ({
  id,
  firstName: "Emily",
  lastName: "Engineer",
  departmentId: "d3",
  positionId: "p2",
});

/** Writes the data of a mock into the cache, as if the page had loaded it before. */
function store(client: ApolloClient, mock: MockLink.MockedResponse) {
  const { query, variables } = mock.request;
  const { data } = mock.result as { data: Record<string, unknown> };
  // The mocks of this feature use plain variables, never a matcher function.
  client.cache.writeQuery({ query, variables: (variables ?? {}) as OperationVariables, data });
}

// renderWithProviders renders elements; this small component runs the hook inside the same providers. The cache holds
// what the page has loaded: the signed-in user `1` (`me`), the employee of the page and a Users list.
function setup(mocks: MockLink.MockedResponse[], pageUserId = "7") {
  let current!: { client: ApolloClient; hook: ReturnType<typeof useUpdateProfile> };
  function Probe(): ReactNode {
    current = { client: useApolloClient(), hook: useUpdateProfile() };
    return null;
  }
  renderWithProviders(<Probe />, { mocks });
  const { client } = current;
  store(client, meMock("ADMIN"));
  store(client, userMock(pageUserId));
  client.cache.writeQuery({
    query: STORED_USERS,
    data: { users: { __typename: "UserPage", total: 1 } },
  });
  return {
    update: (input: UpdateProfileInput) => current.hook.update(input),
    cachedUser: () =>
      client.cache.readQuery({ query: UserDocument, variables: { id: pageUserId } })?.user,
    cachedMe: () => client.cache.readQuery({ query: MeDocument })?.me,
    hasStoredUsers: () => client.cache.readQuery({ query: STORED_USERS }) !== null,
  };
}

describe("useUpdateProfile", () => {
  it("resolves with the saved user and updates the cached user, so the page shows it without a new request", async () => {
    const input = inputFor("7");
    const { update, cachedUser } = setup([updateProfileMock(input)]);

    let saved;
    await act(async () => {
      saved = await update(input);
    });

    expect(saved).toMatchObject({ id: "7", firstName: "Emily", department: { name: "Java" } });
    expect(cachedUser()).toMatchObject({
      firstName: "Emily",
      lastName: "Engineer",
      department: { id: "d3", name: "Java" },
      position: { id: "p2", name: "Data Analyst" },
    });
  });

  it("removes the stored Users lists, so the Users page loads the new name", async () => {
    const input = inputFor("7");
    const { update, hasStoredUsers } = setup([updateProfileMock(input)]);
    expect(hasStoredUsers()).toBe(true);

    await act(async () => {
      await update(input);
    });

    expect(hasStoredUsers()).toBe(false);
  });

  it("updates the signed-in user's names when they save their own profile (sidebar)", async () => {
    const input = inputFor("1");
    const { update, cachedMe } = setup([updateProfileMock(input)], "1");

    await act(async () => {
      await update(input);
    });

    expect(cachedMe()).toMatchObject({
      id: "1",
      firstName: "Emily",
      lastName: "Engineer",
      role: "ADMIN",
    });
  });

  it("keeps the signed-in user's names when an admin saves someone else", async () => {
    const input = inputFor("7");
    const { update, cachedMe } = setup([updateProfileMock(input)]);

    await act(async () => {
      await update(input);
    });

    expect(cachedMe()).toMatchObject({ id: "1", firstName: "Ada", lastName: "Admin" });
  });

  it("rejects with the backend error and changes nothing in the cache", async () => {
    const input = inputFor("7");
    const { update, cachedUser, hasStoredUsers } = setup([
      updateProfileRefusedMock(input, { code: "CONFLICT", reason: CONCURRENT_CHANGE_REASON }),
    ]);

    await act(async () => {
      await expect(update(input)).rejects.toMatchObject({
        errors: [
          expect.objectContaining({
            extensions: { code: "CONFLICT", reason: CONCURRENT_CHANGE_REASON },
          }),
        ],
      });
    });

    expect(cachedUser()).toMatchObject({ firstName: "Emma", department: null });
    expect(hasStoredUsers()).toBe(true);
  });

  it("rejects with the error of the request when the network fails", async () => {
    const input = inputFor("7");
    const { update } = setup([updateProfileNetworkErrorMock(input)]);

    await act(async () => {
      await expect(update(input)).rejects.toThrow("Failed to fetch");
    });
  });
});
