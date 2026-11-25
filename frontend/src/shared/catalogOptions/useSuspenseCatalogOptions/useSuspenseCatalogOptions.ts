"use client";

import type { TypedDocumentNode } from "@apollo/client";
import { useSuspenseQuery } from "@apollo/client/react";
import {
  DepartmentOptionsDocument,
  PositionOptionsDocument,
  type DepartmentOptionsQuery,
  type PositionOptionsQuery,
} from "@/shared/graphql";
import type { CatalogOption, UseCatalogOptionsResult } from "../catalogOptions.types";

/**
 * The options of a select on a page that preloads them on the server (PLAN D6, the Profile tab): the route starts
 * the query with `PreloadQuery`, and this reads the result with `useSuspenseQuery`, so the first HTML already has the
 * options and the browser sends no request of its own. Until the data is there the nearest `<Suspense>` shows its
 * fallback, so `loading` is always false. `errorPolicy: "all"` returns a failure as `failed` (an error and Retry next
 * to the select) instead of throwing it to the error page. `select` must be a stable function.
 */
function usePreloadedOptions<TData>(
  query: TypedDocumentNode<TData, Record<string, never>>,
  select: (data: TData) => readonly CatalogOption[],
): UseCatalogOptionsResult {
  const { data, error, refetch } = useSuspenseQuery(query, { errorPolicy: "all" });
  const failed = error !== undefined || data === undefined;
  return {
    options: failed ? undefined : select(data),
    loading: false,
    failed,
    // The error is in `error` already; the rejected promise only needs to be caught.
    retry: () => void refetch().catch(() => undefined),
  };
}

const selectDepartments = (data: DepartmentOptionsQuery) => data.departmentOptions;
const selectPositions = (data: PositionOptionsQuery) => data.positionOptions;

/** The Department options of a server-preloaded page: every department, by name. */
export function useSuspenseDepartmentOptions(): UseCatalogOptionsResult {
  return usePreloadedOptions(DepartmentOptionsDocument, selectDepartments);
}

/** The Position options of a server-preloaded page: every position, by name. */
export function useSuspensePositionOptions(): UseCatalogOptionsResult {
  return usePreloadedOptions(PositionOptionsDocument, selectPositions);
}
