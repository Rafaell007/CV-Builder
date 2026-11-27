"use client";

import { useTranslations } from "next-intl";
import { useState, type BaseSyntheticEvent } from "react";
import { useToast } from "@/shared/components";
import type { CatalogItem, CatalogNamespace } from "../catalogs.types";
import { useCatalogNameForm } from "../useCatalogNameForm";

/**
 * The Create flow of a catalog (Create department, Create position; Create skill has its own form): the open state of the modal and the request.
 * The form is empty each time the modal opens. A failed request keeps the typed name and shows the error inside the
 * modal. Only a successful request closes the modal and shows a success toast.
 * `create` sends the request of the catalog, resolves with the saved item (the backend may tidy the spaces of the name) and rejects with its error.
 */
export function useCreateCatalogItemForm(
  namespace: CatalogNamespace,
  create: (name: string) => Promise<CatalogItem>,
) {
  const t = useTranslations(namespace);
  const toast = useToast();
  const { form, failed, hasChanged, reset, submit: submitForm } = useCatalogNameForm(namespace);
  const [isOpen, setIsOpen] = useState(false);

  function open() {
    reset("");
    setIsOpen(true);
  }

  async function send(name: string) {
    const created = await create(name);
    setIsOpen(false);
    toast.success({
      title: t("create.success.title"),
      description: t("create.success.text", { name: created.name }),
    });
  }

  function submit(event: BaseSyntheticEvent) {
    return submitForm(event, send);
  }

  return { form, failed, hasChanged, isOpen, open, setOpen: setIsOpen, submit };
}

export type UseCreateCatalogItemFormResult = ReturnType<typeof useCreateCatalogItemForm>;
