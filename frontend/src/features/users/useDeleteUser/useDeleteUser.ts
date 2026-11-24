"use client";

import { useApolloClient, useMutation } from "@apollo/client/react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { useToast } from "@/shared/components";
import { DeleteUserDocument, UsersDocument } from "@/shared/graphql";
import type { UserListItem } from "../users.types";
import { getUserDisplayName, toDeleteUserFailure } from "../utils";

export type UseDeleteUserResult = {
  /** The user the admin chose to delete. The modal is open while this is set. */
  user: UserListItem | null;
  /** True while the request runs. */
  pending: boolean;
  /** Opens the confirmation for this user. */
  askToDelete: (user: UserListItem) => void;
  /** Closes the confirmation without a request. */
  cancel: () => void;
  /** Sends `deleteUser` for the chosen user. Resolves `true` when the user was deleted. A second call while one runs does nothing and resolves `false`. */
  confirm: () => Promise<boolean>;
};

/**
 * State of the delete flow: which user waits for confirmation, and the `deleteUser` request (admin only). On success
 * the user leaves the cache (the row disappears at once), the stored lists of all searches and pages are removed, the
 * open list loads again for the new total, the modal closes and a success toast shows. On failure the modal closes
 * too and an error toast shows the reason: a toast stays behind an open modal where a keyboard user cannot reach it
 * (see the Toast README). A user deleted meanwhile (`NOT_FOUND`) also loads the list again, so the row goes away.
 */
export function useDeleteUser(): UseDeleteUserResult {
  const t = useTranslations("users.delete");
  const toast = useToast();
  const client = useApolloClient();
  const [user, setUser] = useState<UserListItem | null>(null);
  const [deleteUser, { loading }] = useMutation(DeleteUserDocument);

  // A ref changes at once, `loading` only after the next render: two calls in the same tick cannot both pass.
  const sending = useRef(false);

  async function confirm(): Promise<boolean> {
    if (user === null || sending.current) return false;
    sending.current = true;
    try {
      await deleteUser({
        variables: { id: user.id },
        update: (cache) => {
          const id = cache.identify(user);
          if (id !== undefined) cache.evict({ id });
          // A list of another search or page can still hold this user; it must come from the backend when opened.
          cache.evict({ id: "ROOT_QUERY", fieldName: "users" });
          cache.gc();
        },
        // The total and the pages change: the open list loads again with the same search, sort and page.
        refetchQueries: [UsersDocument],
      });
      setUser(null);
      toast.success({
        title: t("success.title"),
        description: t("success.text", { name: getUserDisplayName(user) }),
      });
      return true;
    } catch (error) {
      setUser(null);
      const failure = toDeleteUserFailure(error);
      if (failure === "notFound") {
        client.cache.evict({ id: "ROOT_QUERY", fieldName: "users" });
        // Not awaited: the toast shows at once; the list loads in the background. A failed reload shows the list's
        // own error state, so it is not reported here again.
        client.refetchQueries({ include: [UsersDocument] }).catch(() => undefined);
      }
      toast.error({ title: t("failedTitle"), description: t(failureText(failure)) });
      return false;
    } finally {
      sending.current = false;
    }
  }

  return {
    user,
    pending: loading,
    askToDelete: setUser,
    cancel: () => setUser(null),
    confirm,
  };
}

function failureText(failure: ReturnType<typeof toDeleteUserFailure>) {
  if (failure === "self") return "selfText";
  if (failure === "notFound") return "notFoundText";
  if (failure === "forbidden") return "forbiddenText";
  if (failure === "concurrentChange") return "concurrentChangeText";
  return "failedText";
}
