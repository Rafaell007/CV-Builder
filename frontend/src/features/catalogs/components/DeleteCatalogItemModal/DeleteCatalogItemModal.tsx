import { useTranslations } from "next-intl";
import { useState } from "react";
import { ConfirmModal } from "@/shared/components";
import type { CatalogItem, CatalogNamespace } from "../../catalogs.types";

export interface DeleteCatalogItemModalProps {
  /** Which catalog's texts to show: `catalogs.departments`, `catalogs.positions`, `catalogs.skills` or `catalogs.languages`. */
  namespace: CatalogNamespace;
  /** The item to delete. The modal is open while this is set. */
  item: CatalogItem | null;
  /** The reason the delete failed (the item is in use). Shown inside the modal, which stays open. */
  error?: string | null;
  /** True while the request runs: CONFIRM shows its loading state and cannot send a second request. */
  pending: boolean;
  onConfirm: () => void;
  /** CANCEL, Escape and the × button. */
  onCancel: () => void;
}

/** "Are you sure you want to delete department {name}?" (or position, skill) with CONFIRM and CANCEL. */
export function DeleteCatalogItemModal({
  namespace,
  item,
  error = null,
  pending,
  onConfirm,
  onCancel,
}: DeleteCatalogItemModalProps) {
  const t = useTranslations(namespace);
  // The modal fades out after `item` becomes null: keep the last name so the text does not change while it closes.
  const [shownName, setShownName] = useState("");
  if (item !== null && item.name !== shownName) setShownName(item.name);

  return (
    <ConfirmModal
      open={item !== null}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
      title={t("delete.title")}
      message={t.rich("delete.message", {
        name: shownName,
        strong: (name) => <strong>{name}</strong>,
      })}
      closeLabel={t("delete.close")}
      confirmLabel={t("delete.confirm")}
      cancelLabel={t("delete.cancel")}
      onConfirm={onConfirm}
      error={error}
      isPending={pending}
    />
  );
}
