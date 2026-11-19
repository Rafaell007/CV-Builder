"use client";

import { toListVariables, useListState } from "@/shared/lists";
import { DEFAULT_CATALOG_SORT } from "../../catalogs.constants";
import type { CatalogNamespace } from "../../catalogs.types";
import { useCreateCatalogItemForm } from "../../useCreateCatalogItemForm";
import { useDeleteCatalogItem } from "../../useDeleteCatalogItem";
import { useUpdateCatalogItemForm } from "../../useUpdateCatalogItemForm";
import { CatalogPage } from "../CatalogPage";
import { useCreatePosition } from "./useCreatePosition";
import { useDeletePosition } from "./useDeletePosition";
import { usePositions } from "./usePositions";
import { useUpdatePosition } from "./useUpdatePosition";

const NAMESPACE: CatalogNamespace = "catalogs.positions";

/**
 * Content of the `/admin/positions` page under its `PageHeader`: the shared `CatalogPage` with the position
 * requests. The backend searches, sorts and cuts the pages.
 */
export function Positions() {
  const list = useListState(DEFAULT_CATALOG_SORT);
  const query = usePositions(toListVariables(list));
  const { create } = useCreatePosition();
  const { update } = useUpdatePosition();
  const { remove } = useDeletePosition();

  const creation = useCreateCatalogItemForm(NAMESPACE, create);
  const editing = useUpdateCatalogItemForm(NAMESPACE, update);
  const deletion = useDeleteCatalogItem(NAMESPACE, remove);

  return (
    <CatalogPage
      namespace={NAMESPACE}
      list={list}
      query={query}
      creation={creation}
      editing={editing}
      deletion={deletion}
    />
  );
}
