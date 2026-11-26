"use client";

import { useApolloClient } from "@apollo/client/react";
import { useState } from "react";
import { UserDocument } from "@/shared/graphql";
import { redirectToSignIn, refreshSession } from "@/shared/session";
import { checkAvatarFile } from "../utils";

/** How an upload ended. Every value except `"uploaded"` is an error the Profile tab shows in a toast. */
export type AvatarUploadOutcome = "uploaded" | "wrongType" | "tooLarge" | "forbidden" | "failed";

export type UseUploadAvatarResult = {
  /** True while the request runs. */
  pending: boolean;
  /** Checks the file, sends it and loads the user again. Resolves with the outcome; never rejects. */
  upload: (file: File) => Promise<AvatarUploadOutcome>;
};

/** The multipart field the backend reads the image from (`AVATAR_FILE_FIELD` there). */
const FILE_FIELD = "file";

/**
 * Sends one avatar to `POST /api/users/:id/avatar` (PLAN D11). REST, not GraphQL, because the body is a file; the
 * browser calls the frontend's own `/api`, and the Next.js rewrite passes it on with the cookies (D8).
 * - A wrong type or a too big file is refused here at once (AC-19, AC-20); the backend checks the content again (415).
 * - An expired access token (401) refreshes the session and sends the file once more, like the Apollo session link.
 *   When the session is over, the browser goes to sign-in and the promise never settles, so no error flashes first.
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
    let status = await send(userId, file);
    if (status === 401) {
      const refresh = await refreshSession();
      // A refresh without an answer ("failed") does not end the session: the 401 becomes a "failed" toast.
      let sessionEnded = refresh === "rejected";
      if (refresh === "refreshed") {
        status = await send(userId, file);
        sessionEnded = status === 401;
      }
      if (sessionEnded && redirectToSignIn()) {
        // `pending` stays true: the control stays disabled until the browser leaves.
        return new Promise<never>(() => {});
      }
    }

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

/** One POST. Resolves with the HTTP status, or `null` when there is no answer (offline, server down). */
async function send(userId: string, file: File): Promise<number | null> {
  const body = new FormData();
  body.append(FILE_FIELD, file);
  try {
    // No `content-type` header: the browser sets `multipart/form-data` with the boundary itself.
    const response = await fetch(`/api/users/${encodeURIComponent(userId)}/avatar`, {
      method: "POST",
      body,
    });
    return response.status;
  } catch {
    return null;
  }
}

function toOutcome(status: number | null): AvatarUploadOutcome {
  if (status === 204) return "uploaded";
  if (status === 413) return "tooLarge";
  if (status === 415) return "wrongType";
  if (status === 403) return "forbidden";
  return "failed";
}
