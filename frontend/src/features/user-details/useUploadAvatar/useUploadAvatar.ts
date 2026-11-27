"use client";

import { useApolloClient } from "@apollo/client/react";
import { useState } from "react";
import { UserDocument } from "@/shared/graphql";
import { requestAvatar } from "../avatarRequest";
import { checkAvatarFile } from "../utils";

/** How an upload ended. Every value except `"uploaded"` is an error the Profile tab shows in a toast. */
export type AvatarUploadOutcome = "uploaded" | "wrongType" | "tooLarge" | "forbidden" | "failed";

export type UseUploadAvatarResult = {
  /** True while the request runs. */
  pending: boolean;
  /** Checks the file, sends it and loads the user again. Resolves with the outcome; never rejects. */
  upload: (file: File) => Promise<AvatarUploadOutcome>;
};

/**
 * Sends one avatar to `POST /api/users/:id/avatar` (PLAN D11; session refresh and sign-in: `requestAvatar`).
 * - A wrong type or a too big file is refused here at once (AC-19, AC-20); the backend checks the content again (415).
 * - When the session is over, the promise never settles and `pending` stays true until the browser leaves.
 * - On success the backend answers 204 without a body, so the `User` query loads again for the new `avatarUrl`, and
 *   the stored Users lists are removed (their rows show the photo too).
 * - A failed upload changes nothing: the old avatar stays (AC-23).
 */
export function useUploadAvatar(userId: string): UseUploadAvatarResult {
  const client = useApolloClient();
  const [pending, setPending] = useState(false);

  async function upload(file: File): Promise<AvatarUploadOutcome> {
    const check = checkAvatarFile(file);
    if (check !== "ok") return check;

    setPending(true);
    const status = await requestAvatar(userId, "POST", file);
    if (status === 204) {
      client.cache.evict({ id: "ROOT_QUERY", fieldName: "users" });
      // The file is saved even if this reload fails; the page then shows the old photo until the next load.
      await client.refetchQueries({ include: [UserDocument] }).catch(() => undefined);
    }
    setPending(false);
    return toOutcome(status);
  }

  return { pending, upload };
}

function toOutcome(status: number | null): AvatarUploadOutcome {
  if (status === 204) return "uploaded";
  if (status === 413) return "tooLarge";
  if (status === 415) return "wrongType";
  if (status === 403) return "forbidden";
  return "failed";
}
