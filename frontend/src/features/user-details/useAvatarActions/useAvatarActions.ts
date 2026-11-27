"use client";

import { useApolloClient } from "@apollo/client/react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { useToast } from "@/shared/components";
import { UserDocument } from "@/shared/graphql";
import { requestAvatar } from "../avatarRequest";
import { AVATAR_MAX_MB } from "../user-details.constants";
import { checkAvatarFile } from "../utils";

export type UseAvatarActionsResult = {
  /** True while an upload or a removal runs: the upload control and the Remove button are disabled. */
  busy: boolean;
  /** Checks the file, uploads it, then shows a toast. */
  upload: (file: File) => Promise<void>;
  /** Removes the avatar, then shows a toast. */
  remove: () => Promise<void>;
};

/** Why an avatar action failed. Each reason has its own text in the error toast. */
type AvatarFailure = "wrongType" | "tooLarge" | "forbidden" | "tryAgain";

/**
 * The avatar actions of the Profile tab: upload (`POST /api/users/:id/avatar`) and remove (`DELETE`), each ending in a
 * toast (PLAN D11). Figma's only error UI is the error toast (Design system › Notifications); a success toast tells
 * screen readers what happened, like "Profile updated".
 * - One action at a time: a second one while the first runs is ignored.
 * - A wrong type or a too big file is refused here at once, without a request (AC-19, AC-20); the backend checks the
 *   content again (415).
 * - On 204 (the backend sends no body, also for a removal without an avatar) the `User` query loads again for the new
 *   `avatarUrl`, and the stored Users lists are removed (their rows show the photo too).
 * - A failed action changes nothing: the old avatar stays (AC-23).
 * - When the session is over, the browser goes to sign-in, no toast shows and `busy` stays true (`requestAvatar`).
 */
export function useAvatarActions(userId: string): UseAvatarActionsResult {
  const t = useTranslations("userDetails.profile.avatar");
  const toast = useToast();
  const client = useApolloClient();
  const [busy, setBusy] = useState(false);
  // A ref changes at once: two actions in the same tick cannot both start.
  const running = useRef(false);

  async function runOnce(action: () => Promise<void>) {
    if (running.current) return;
    running.current = true;
    try {
      await action();
    } finally {
      running.current = false;
    }
  }

  function showFailure(title: string, failure: AvatarFailure) {
    const description = {
      wrongType: t("errors.wrongType"),
      tooLarge: t("errors.tooLarge", { max: AVATAR_MAX_MB }),
      forbidden: t("errors.forbidden"),
      tryAgain: t("errors.tryAgain"),
    }[failure];
    toast.error({ title, description });
  }

  async function send(request: Promise<number | null>, titles: { done: string; failed: string }) {
    setBusy(true);
    const status = await request;
    if (status === 204) {
      client.cache.evict({ id: "ROOT_QUERY", fieldName: "users" });
      // The change is saved even if this reload fails; the page then shows the old photo until the next load.
      await client.refetchQueries({ include: [UserDocument] }).catch(() => undefined);
      toast.success({ title: titles.done });
    } else {
      showFailure(titles.failed, toFailure(status));
    }
    setBusy(false);
  }

  async function upload(file: File) {
    const check = checkAvatarFile(file);
    if (check !== "ok") return showFailure(t("errors.uploadFailed"), check);
    await send(requestAvatar(userId, "POST", file), {
      done: t("uploaded"),
      failed: t("errors.uploadFailed"),
    });
  }

  async function remove() {
    await send(requestAvatar(userId, "DELETE"), {
      done: t("removed"),
      failed: t("errors.removeFailed"),
    });
  }

  return {
    busy,
    upload: (file) => runOnce(() => upload(file)),
    remove: () => runOnce(remove),
  };
}

function toFailure(status: number | null): AvatarFailure {
  if (status === 413) return "tooLarge";
  if (status === 415) return "wrongType";
  if (status === 403) return "forbidden";
  return "tryAgain";
}
