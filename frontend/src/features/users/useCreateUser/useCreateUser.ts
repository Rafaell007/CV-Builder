"use client";

import { useMutation } from "@apollo/client/react";
import { CreateUserDocument, UsersDocument, type CreateUserInput } from "@/shared/graphql";
import type { UserListItem } from "../users.types";

export type UseCreateUserResult = {
  /** True while the request runs. */
  pending: boolean;
  /** Sends `createUser`. Resolves with the new user. Rejects with the request's error, so the caller can show it and keep the form values. */
  create: (input: CreateUserInput) => Promise<UserListItem>;
};

/**
 * The `createUser` request (AC-14). On success the open `Users` list loads again: the new user belongs in the
 * sorted, searched and cut list at a place only the backend knows, and the total changes. The stored lists of all
 * other searches and pages are removed, so opening one of them asks the backend again.
 */
export function useCreateUser(): UseCreateUserResult {
  const [createUser, { loading }] = useMutation(CreateUserDocument);

  async function create(input: CreateUserInput): Promise<UserListItem> {
    const { data } = await createUser({
      variables: { input },
      // Another search or page stored earlier would miss the new user and show an old total.
      update: (cache) => void cache.evict({ id: "ROOT_QUERY", fieldName: "users" }),
      refetchQueries: [UsersDocument],
    });
    // `useMutation` rejects on an error, so a missing result is not expected; fail loudly if it ever happens.
    if (!data) throw new Error("createUser returned no user");
    return data.createUser;
  }

  return { pending: loading, create };
}
