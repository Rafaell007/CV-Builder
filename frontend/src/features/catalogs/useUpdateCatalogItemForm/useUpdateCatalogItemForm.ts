"use client";

import { useTranslations } from "next-intl";
import { useState, type BaseSyntheticEvent } from "react";
import { useToast } from "@/shared/components";
import type { CatalogItem, CatalogNamespace } from "../catalogs.types";
import { useCatalogNameForm } from "../useCatalogNameForm";

/**
 * The Update flow of a catalog (Update department, Update position; Update skill has its own form): the item that is being edited, the open state
 * of the modal and the request. `open(item)` fills the form with the current name. A failed request keeps the typed
 * name and shows the error inside the modal. Only a successful request closes the modal and shows a success toast.
 * `update` sends the request of the catalog for the id, resolves with the saved item and rejects with its error.
 */
export function useUpdateCatalogItemForm(
  namespace: CatalogNamespace,
  update: (id: string, name: string) => Promise<CatalogItem>,
) {
  const t = useTranslations(namespace);
  const toast = useToast();
  const { form, failed, hasChanged, reset, submit: submitForm } = useCatalogNameForm(namespace);
  // The item stays set while the modal fades out, so the request still has its id.
  const [item, setItem] = useState<CatalogItem | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  function open(chosen: CatalogItem) {
    reset(chosen.name);
    setItem(chosen);
    setIsOpen(true);
  }

  async function send(name: string) {
    if (!item) return;
    const saved = await update(item.id, name);
    setIsOpen(false);
    toast.success({
      title: t("update.success.title"),
      description: t("update.success.text", { name: saved.name }),
    });
  }

  function submit(event: BaseSyntheticEvent) {
    return submitForm(event, send);
  }

  return { form, failed, hasChanged, isOpen, open, setOpen: setIsOpen, submit };
}

export type UseUpdateCatalogItemFormResult = ReturnType<typeof useUpdateCatalogItemForm>;
