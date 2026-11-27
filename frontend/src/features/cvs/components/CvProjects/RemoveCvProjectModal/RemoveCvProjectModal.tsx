import { useTranslations } from "next-intl";
import { useState } from "react";
import { ConfirmModal } from "@/shared/components";
import type { CvProjectItem } from "../cvProjects.types";

export interface RemoveCvProjectModalProps {
  /** The CV project to remove. The modal is open while this is set. */
  cvProject: CvProjectItem | null;
  /** True while the request runs: CONFIRM shows its loading state and cannot send a second request. */
  pending: boolean;
  onConfirm: () => void;
  /** CANCEL, Escape and the × button. */
  onCancel: () => void;
}

/** "Are you sure you want to remove project {name}?" with CONFIRM and CANCEL (page 23, Delete Project). */
export function RemoveCvProjectModal({
  cvProject,
  pending,
  onConfirm,
  onCancel,
}: RemoveCvProjectModalProps) {
  const t = useTranslations("cvs.projects.remove");
  // The modal fades out after `cvProject` becomes null: keep the last name so the text does not change while it closes.
  const [shownName, setShownName] = useState("");
  const name = cvProject?.project.name;
  if (name !== undefined && name !== shownName) setShownName(name);

  return (
    <ConfirmModal
      open={cvProject !== null}
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
