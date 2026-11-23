"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { useToast } from "@/shared/components";
import { readFailure } from "@/shared/failures";
import type { CatalogItem, CatalogNamespace } from "../catalogs.types";

export type UseDeleteCatalogItemResult = {
  /** The item the user chose to delete. The modal is open while this is set. */
  item: CatalogItem | null;
  /** The reason the last request failed when the modal stays open (the item is in use), shown inside the modal. `null` otherwise. */
  error: string | null;
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
 * closes. When the item is in use (`CONFLICT`) the modal stays open and shows the reason inside (`error`); CONFIRM and
 * CANCEL still work. Any other failure closes the modal and shows an error toast (a toast stays behind an open modal
 * where a keyboard user cannot reach it, see the Toast README). The table keeps its search, sort and page.
 * `remove` sends the request of the catalog for the id and rejects with its error.
 */
export function useDeleteCatalogItem(
  namespace: CatalogNamespace,
  remove: (id: string) => Promise<unknown>,
): UseDeleteCatalogItemResult {
  const t = useTranslations(namespace);
  const toast = useToast();
  const [item, setItem] = useState<CatalogItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // A ref changes at once, state only after the next render: two calls in the same tick cannot both pass.
  const sending = useRef(false);

  async function confirm(): Promise<boolean> {
    if (item === null || sending.current) return false;
    sending.current = true;
    setPending(true);
    setError(null);
    try {
      await remove(item.id);
      setItem(null);
      return true;
    } catch (failure) {
      if (readFailure(failure).kind === "conflict") {
        // The modal stays open: the user reads the reason there and can cancel or try again.
        setError(t("delete.inUseText"));
      } else {
        setItem(null);
        toast.error({ title: t("delete.failedTitle"), description: t("delete.failedText") });
      }
      return false;
    } finally {
      sending.current = false;
      setPending(false);
    }
  }

  return {
    item,
    error,
    pending,
    askToDelete: (chosen) => {
      setError(null);
      setItem(chosen);
    },
    cancel: () => {
      setError(null);
      setItem(null);
    },
    confirm,
  };
}
