"use client";

import { toListVariables, useListState } from "@/shared/lists";
import { DEFAULT_CATALOG_SORT } from "../../catalogs.constants";
import type { CatalogNamespace } from "../../catalogs.types";
import { useCreateCatalogItemForm } from "../../useCreateCatalogItemForm";
import { useDeleteCatalogItem } from "../../useDeleteCatalogItem";
import { useUpdateCatalogItemForm } from "../../useUpdateCatalogItemForm";
import { CatalogPage } from "../CatalogPage";
import { NameFormModal } from "../NameFormModal";
import { useCreateDepartment } from "./useCreateDepartment";
import { useDeleteDepartment } from "./useDeleteDepartment";
import { useDepartments } from "./useDepartments";
import { useUpdateDepartment } from "./useUpdateDepartment";

const NAMESPACE: CatalogNamespace = "catalogs.departments";

/**
 * Content of the `/admin/departments` page under its `PageHeader`: the shared `CatalogPage` with the department
 * requests. The backend searches, sorts and cuts the pages.
 */
export function Departments() {
  const list = useListState(DEFAULT_CATALOG_SORT);
  const query = useDepartments(toListVariables(list));
  const { create } = useCreateDepartment();
  const { update } = useUpdateDepartment();
  const { remove } = useDeleteDepartment();

  const creation = useCreateCatalogItemForm(NAMESPACE, create);
  const editing = useUpdateCatalogItemForm(NAMESPACE, update);
  const deletion = useDeleteCatalogItem(NAMESPACE, remove);

  return (
    <CatalogPage
      namespace={NAMESPACE}
      list={list}
      query={query}
      onCreate={creation.open}
      onEdit={editing.open}
      deletion={deletion}
      modals={
        <>
          <NameFormModal namespace={NAMESPACE} kind="create" nameForm={creation} />
          <NameFormModal namespace={NAMESPACE} kind="update" nameForm={editing} />
        </>
      }
    />
  );
}
