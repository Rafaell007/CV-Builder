import { useTranslations } from "next-intl";
import { ConfirmModal } from "@/shared/components";

export interface RemoveCvSkillsModalProps {
  open: boolean;
  /** How many skills are chosen. */
  count: number;
  /** True while the request runs: CONFIRM shows its loading state and cannot send a second request. */
  pending: boolean;
  onConfirm: () => void;
  /** CANCEL, Escape and the × button. The skills stay chosen. */
  onCancel: () => void;
}

/** "Are you sure you want to remove {count} skills?" with CONFIRM and CANCEL (page 22, Remove Skills Modal). */
export function RemoveCvSkillsModal({
  open,
  count,
  pending,
  onConfirm,
  onCancel,
}: RemoveCvSkillsModalProps) {
  const t = useTranslations("cvs.skills.remove");

  return (
    <ConfirmModal
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
      title={t("title")}
      message={t("message", { count })}
      closeLabel={t("close")}
      confirmLabel={t("confirm")}
      cancelLabel={t("cancel")}
      onConfirm={onConfirm}
      isPending={pending}
    />
  );
}
