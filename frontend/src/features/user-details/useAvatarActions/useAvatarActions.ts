"use client";

import { useTranslations } from "next-intl";
import { useRef } from "react";
import { useToast } from "@/shared/components";
import { useRemoveAvatar, type AvatarRemoveOutcome } from "../useRemoveAvatar";
import { useUploadAvatar, type AvatarUploadOutcome } from "../useUploadAvatar";
import { AVATAR_MAX_MB } from "../user-details.constants";

export type UseAvatarActionsResult = {
  /** True while an upload or a removal runs: the upload control and the Remove button are disabled. */
  busy: boolean;
  /** Uploads the chosen file, then shows a toast. */
  upload: (file: File) => Promise<void>;
  /** Removes the avatar, then shows a toast. */
  remove: () => Promise<void>;
};

/**
 * The avatar actions of the Profile tab: upload and remove, each ending in a toast. Figma's only error UI is the
 * error toast (Design system › Notifications); a success toast tells screen readers what happened, like
 * "Profile updated". One action at a time: a second one while the first runs is ignored. When the session is over,
 * the browser goes to sign-in and no toast shows (`requestAvatar`).
 */
export function useAvatarActions(userId: string): UseAvatarActionsResult {
  const t = useTranslations("userDetails.profile.avatar");
  const toast = useToast();
  const uploader = useUploadAvatar(userId);
  const remover = useRemoveAvatar(userId);
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

  function showUploadOutcome(outcome: AvatarUploadOutcome) {
    if (outcome === "uploaded") return toast.success({ title: t("uploaded") });
    const reason = {
      wrongType: t("errors.wrongType"),
      tooLarge: t("errors.tooLarge", { max: AVATAR_MAX_MB }),
      forbidden: t("errors.forbidden"),
      failed: t("errors.tryAgain"),
    }[outcome];
    toast.error({ title: t("errors.uploadFailed"), description: reason });
  }

  function showRemoveOutcome(outcome: AvatarRemoveOutcome) {
    if (outcome === "removed") return toast.success({ title: t("removed") });
    const reason = outcome === "forbidden" ? t("errors.forbidden") : t("errors.tryAgain");
    toast.error({ title: t("errors.removeFailed"), description: reason });
  }

  return {
    busy: uploader.pending || remover.pending,
    upload: (file) => runOnce(async () => showUploadOutcome(await uploader.upload(file))),
    remove: () => runOnce(async () => showRemoveOutcome(await remover.remove())),
  };
}
