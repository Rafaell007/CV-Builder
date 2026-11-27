import { useTranslations } from "next-intl";
import { useState } from "react";
import { ConfirmModal } from "@/shared/components";
import type { CvListItem } from "../../cvs.types";

export interface DeleteCvModalProps {
  /** The CV to delete. The modal is open while this is set. */
  cv: CvListItem | null;
  /** True while the request runs: CONFIRM shows its loading state and cannot send a second request. */
  pending: boolean;
  onConfirm: () => void;
  /** CANCEL, Escape and the × button. */
  onCancel: () => void;
}

/** "Are you sure you want to delete CV {name}?" with CONFIRM and CANCEL (page 20, Delete CV). */
export function DeleteCvModal({ cv, pending, onConfirm, onCancel }: DeleteCvModalProps) {
  const t = useTranslations("cvs.delete");
  // The modal fades out after `cv` becomes null: keep the last name so the text does not change while it closes.
  const [shownName, setShownName] = useState("");
  if (cv !== null && cv.name !== shownName) setShownName(cv.name);

  return (
    <ConfirmModal
      open={cv !== null}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
      title={t("title")}
      message={t.rich("message", {
        name: shownName,
        strong: (name) => <strong>{name}</strong>,
      })}
      closeLabel={t("close")}
      confirmLabel={t("confirm")}
      cancelLabel={t("cancel")}
      onConfirm={onConfirm}
      isPending={pending}
    />
  );
}
