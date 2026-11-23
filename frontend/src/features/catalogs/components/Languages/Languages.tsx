"use client";

import { useTranslations } from "next-intl";
import type { DataTableColumn } from "@/shared/components";
import { DESKTOP_MIN_WIDTH } from "@/shared/constants";
import { toListVariables, useListState } from "@/shared/lists";
import { DEFAULT_CATALOG_SORT } from "../../catalogs.constants";
import type { CatalogNamespace } from "../../catalogs.types";
import { useDeleteCatalogItem } from "../../useDeleteCatalogItem";
import { CatalogPage } from "../CatalogPage";
import { LanguageFormModal } from "./LanguageFormModal";
import { LANGUAGE_SORT_FIELDS } from "./languages.constants";
import type { LanguageListItem } from "./languages.types";
import { useCreateLanguage } from "./useCreateLanguage";
import { useCreateLanguageForm } from "./useCreateLanguageForm";
import { useDeleteLanguage } from "./useDeleteLanguage";
import { useLanguages } from "./useLanguages";
import { useUpdateLanguage } from "./useUpdateLanguage";
import { useUpdateLanguageForm } from "./useUpdateLanguageForm";

const NAMESPACE: CatalogNamespace = "catalogs.languages";

/**
 * Content of the `/admin/languages` page under its `PageHeader`: the shared `CatalogPage` with the language requests,
 * the ISO and Native name columns and the language modals. The backend searches, sorts and cuts the pages.
 */
export function Languages() {
  const t = useTranslations(NAMESPACE);
  const list = useListState(DEFAULT_CATALOG_SORT);
  const query = useLanguages(toListVariables(list));
  const { create } = useCreateLanguage();
  const { update } = useUpdateLanguage();
  const { remove } = useDeleteLanguage();

  const creation = useCreateLanguageForm(create);
  const editing = useUpdateLanguageForm(update);
  const deletion = useDeleteCatalogItem(NAMESPACE, remove);

  // Figma order: Name (from CatalogTable), ISO, Native name. Name and ISO sort (doc AC-9); 768 hides Native name.
  const extraColumns: DataTableColumn<LanguageListItem>[] = [
    {
      id: "iso",
      header: t("columns.iso"),
      cell: (language) => language.iso,
      sortField: LANGUAGE_SORT_FIELDS.iso,
    },
    {
      id: "nativeName",
      header: t("columns.nativeName"),
      cell: (language) => language.nativeName,
      hideBelow: DESKTOP_MIN_WIDTH,
    },
  ];

  return (
    <CatalogPage
      namespace={NAMESPACE}
      list={list}
      query={query}
      extraColumns={extraColumns}
      onCreate={creation.open}
      onEdit={editing.open}
      deletion={deletion}
      modals={
        <>
          <LanguageFormModal kind="create" languageForm={creation} />
          <LanguageFormModal kind="update" languageForm={editing} />
        </>
      }
    />
  );
}
