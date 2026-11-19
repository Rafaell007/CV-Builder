"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { useToast } from "@/shared/components";
import type { CatalogItem, CatalogNamespace } from "../catalogs.types";
import { isCatalogConflict } from "../utils";

export type UseDeleteCatalogItemResult = {
  /** The item the user chose to delete. The modal is open while this is set. */
  item: CatalogItem | null;
  /** True while the request runs. */
  pending: boolean;
  /** Opens the confirmation for this item. */
  askToDelete: (item: CatalogItem) => void;
  /** Closes the confirmation without a request. */
  cancel: () => void;
  /** Sends the delete request for the chosen item. Resolves `true` when it was deleted. A second call while one runs does nothing and resolves `false`. */
  confirm: () => Promise<boolean>;
};

/**
 * State of the delete flow of a catalog: which item waits for confirmation, and the request. On success the modal
 * closes. On failure the modal closes too and an error toast shows the reason (`CONFLICT` = the item is in use): a
 * toast stays behind an open modal where a keyboard user cannot reach it (see the Toast README). The table keeps its
 * search, sort and page. `remove` sends the request of the catalog for the id and rejects with its error.
 */
export function useDeleteCatalogItem(
  namespace: CatalogNamespace,
  remove: (id: string) => Promise<unknown>,
): UseDeleteCatalogItemResult {
  const t = useTranslations(namespace);
  const toast = useToast();
  const [item, setItem] = useState<CatalogItem | null>(null);
  const [pending, setPending] = useState(false);

  // A ref changes at once, state only after the next render: two calls in the same tick cannot both pass.
  const sending = useRef(false);

  async function confirm(): Promise<boolean> {
    if (item === null || sending.current) return false;
    sending.current = true;
    setPending(true);
    try {
      await remove(item.id);
      setItem(null);
      return true;
    } catch (error) {
      setItem(null);
      toast.error({
        title: t("delete.failedTitle"),
        description: isCatalogConflict(error) ? t("delete.inUseText") : t("delete.failedText"),
      });
      return false;
    } finally {
      sending.current = false;
      setPending(false);
    }
  }

  return {
    item,
    pending,
    askToDelete: setItem,
    cancel: () => setItem(null),
    confirm,
  };
}
