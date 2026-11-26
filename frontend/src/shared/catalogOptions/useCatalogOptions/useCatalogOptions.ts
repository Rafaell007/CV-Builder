"use client";

import type { TypedDocumentNode } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import {
  DepartmentOptionsDocument,
  PositionOptionsDocument,
  type DepartmentOptionsQuery,
  type PositionOptionsQuery,
} from "@/shared/graphql";
import type { CatalogOption, UseCatalogOptionsResult } from "../catalogOptions.types";

/**
 * The options of a select that loads when it is shown (the Create and Update user modals). It sends nothing while
 * `enabled` is false (the modal is closed) and asks the server again each time `enabled` turns true, so an item that
 * an admin added a minute ago is there. `select` must be a stable function (defined outside the component).
 */
function useOptionsOnDemand<TData>(
  query: TypedDocumentNode<TData, Record<string, never>>,
  select: (data: TData) => readonly CatalogOption[],
  enabled: boolean,
): UseCatalogOptionsResult {
  // network-only: always the current catalog, never a copy from an earlier opening.
  const { data, loading, error, refetch } = useQuery(query, {
    skip: !enabled,
    fetchPolicy: "network-only",
  });
  const failed = enabled && error !== undefined;
  return {
    options: enabled && !loading && !failed && data ? select(data) : undefined,
    loading: enabled && loading,
    failed,
    // The error is in `error` already; the rejected promise only needs to be caught.
    retry: () => void refetch().catch(() => undefined),
  };
}

const selectDepartments = (data: DepartmentOptionsQuery) => data.departmentOptions;
const selectPositions = (data: PositionOptionsQuery) => data.positionOptions;

/** The Department options of a modal: every department, by name, loaded each time `enabled` turns true. */
export function useDepartmentOptions(enabled: boolean): UseCatalogOptionsResult {
  return useOptionsOnDemand(DepartmentOptionsDocument, selectDepartments, enabled);
}

/** The Position options of a modal: every position, by name, loaded each time `enabled` turns true. */
export function usePositionOptions(enabled: boolean): UseCatalogOptionsResult {
  return useOptionsOnDemand(PositionOptionsDocument, selectPositions, enabled);
}
