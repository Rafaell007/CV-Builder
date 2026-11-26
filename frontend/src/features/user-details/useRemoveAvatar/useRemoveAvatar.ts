"use client";

import { useApolloClient } from "@apollo/client/react";
import { useState } from "react";
import { UserDocument } from "@/shared/graphql";
import { requestAvatar } from "../avatarRequest";

/** How a removal ended. Every value except `"removed"` is an error the Profile tab shows in a toast. */
export type AvatarRemoveOutcome = "removed" | "forbidden" | "failed";

export type UseRemoveAvatarResult = {
  /** True while the request runs. */
  pending: boolean;
  /** Removes the avatar and loads the user again. Resolves with the outcome; never rejects. */
  remove: () => Promise<AvatarRemoveOutcome>;
};

/**
 * Removes the avatar with `DELETE /api/users/:id/avatar` (PLAN D11; session refresh and sign-in: `requestAvatar`).
 * - When the session is over, the promise never settles and `pending` stays true until the browser leaves.
 * - On success the backend answers 204 (also when there was no avatar), so the `User` query loads again for
 *   `avatarUrl: null`, and the stored Users lists are removed (their rows show the photo too).
 * - A failed removal changes nothing: the photo stays.
 */
export function useRemoveAvatar(userId: string): UseRemoveAvatarResult {
  const client = useApolloClient();
  const [pending, setPending] = useState(false);

  async function remove(): Promise<AvatarRemoveOutcome> {
    setPending(true);
    const status = await requestAvatar(userId, "DELETE");
    if (status === 204) {
      client.cache.evict({ id: "ROOT_QUERY", fieldName: "users" });
      // The avatar is removed even if this reload fails; the page then shows the old photo until the next load.
      await client.refetchQueries({ include: [UserDocument] }).catch(() => undefined);
    }
    setPending(false);
    return toOutcome(status);
  }

  return { pending, remove };
}

function toOutcome(status: number | null): AvatarRemoveOutcome {
  if (status === 204) return "removed";
  if (status === 403) return "forbidden";
  return "failed";
}
