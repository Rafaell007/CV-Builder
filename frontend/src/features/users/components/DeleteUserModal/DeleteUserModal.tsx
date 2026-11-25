import { useTranslations } from "next-intl";
import { useState } from "react";
import { ConfirmModal } from "@/shared/components";
import type { UserListItem } from "../../users.types";
import { getUserDisplayName } from "@/shared/utils";

export interface DeleteUserModalProps {
  /** The user to delete. The modal is open while this is set. */
  user: UserListItem | null;
  /** True while the request runs: CONFIRM shows its loading state and cannot send a second request. */
  pending: boolean;
  onConfirm: () => void;
  /** CANCEL, Escape and the × button. */
  onCancel: () => void;
}

/**
 * "Are you sure you want to delete user {firstName} {lastName}?" with CONFIRM and CANCEL (Figma Delete user). A user
 * without a name is shown by their email.
 */
export function DeleteUserModal({ user, pending, onConfirm, onCancel }: DeleteUserModalProps) {
  const t = useTranslations("users.delete");
  // The modal fades out after `user` becomes null: keep the last name so the text does not change while it closes.
  const [shownName, setShownName] = useState("");
  const name = user === null ? null : getUserDisplayName(user);
  if (name !== null && name !== shownName) setShownName(name);

  return (
    <ConfirmModal
      open={user !== null}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
      title={t("title")}
      message={t.rich("message", {
        name: shownName,
        strong: (text) => <strong>{text}</strong>,
      })}
      closeLabel={t("close")}
      confirmLabel={t("confirm")}
      cancelLabel={t("cancel")}
      onConfirm={onConfirm}
      isPending={pending}
    />
  );
}
