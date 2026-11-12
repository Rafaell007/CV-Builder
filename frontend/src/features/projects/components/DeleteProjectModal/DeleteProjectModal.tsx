import { useTranslations } from "next-intl";
import { ConfirmModal } from "@/shared/components";
import type { ProjectListItem } from "../../projects.types";

export interface DeleteProjectModalProps {
  /** The project to delete. The modal is open while this is set. */
  project: ProjectListItem | null;
  /** True while the request runs: CONFIRM shows its loading state and cannot send a second request. */
  pending: boolean;
  onConfirm: () => void;
  /** CANCEL, Escape and the × button. */
  onCancel: () => void;
}

/** "Are you sure you want to delete project {name}?" with CONFIRM and CANCEL (page 27, Delete Project). */
export function DeleteProjectModal({
  project,
  pending,
  onConfirm,
  onCancel,
}: DeleteProjectModalProps) {
  const t = useTranslations("projects.delete");

  return (
    <ConfirmModal
      open={project !== null}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
      title={t("title")}
      message={t.rich("message", {
        name: project?.name ?? "",
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
