"use client";

import { useApolloClient, useMutation } from "@apollo/client/react";
import { readFailure } from "@/shared/failures";
import { UpdateUserDocument, UsersDocument, type UpdateUserInput } from "@/shared/graphql";
import type { UserListItem } from "../users.types";

export type UseUpdateUserResult = {
  /** True while the request runs. */
  pending: boolean;
  /** Sends `updateUser`. Resolves with the saved user. Rejects with the request's error, so the caller can show it and keep the form values. */
  update: (input: UpdateUserInput) => Promise<UserListItem>;
};

/**
 * The `updateUser` request (AC-27). On success the open `Users` list loads again: a changed name, department or
 * position can move the user in the sorted, searched and cut list, and only the backend knows where. The stored
 * lists of all other searches and pages are removed, so opening one of them asks the backend again. A user deleted
 * meanwhile (`NOT_FOUND`) also loads the list again, so the row of the deleted user goes away.
 */
export function useUpdateUser(): UseUpdateUserResult {
  const client = useApolloClient();
  const [updateUser, { loading }] = useMutation(UpdateUserDocument);

  async function update(input: UpdateUserInput): Promise<UserListItem> {
    try {
      const { data } = await updateUser({
        variables: { input },
        // A list of another search can hold this user under the old name; it must come from the backend when opened again.
        update: (cache) => void cache.evict({ id: "ROOT_QUERY", fieldName: "users" }),
        refetchQueries: [UsersDocument],
      });
      // `useMutation` rejects on an error, so a missing result is not expected; fail loudly if it ever happens.
      if (!data) throw new Error("updateUser returned no user");
      return data.updateUser;
    } catch (error) {
      if (readFailure(error).kind === "notFound") {
        client.cache.evict({ id: "ROOT_QUERY", fieldName: "users" });
        // Not awaited: the caller shows the error at once; the list loads in the background. A failed reload shows
        // the list's own error state, so it is not reported here again.
        client.refetchQueries({ include: [UsersDocument] }).catch(() => undefined);
      }
      throw error;
    }
  }

  return { pending: loading, update };
}
