"use client";

import type { TypedDocumentNode } from "@apollo/client";
import { useSuspenseQuery } from "@apollo/client/react";
import { useTransition } from "react";
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
 * options and the browser sends no request of its own. Until the first data is there the nearest `<Suspense>` shows
 * its fallback. `errorPolicy: "all"` returns a failure as `failed` (an error and Retry next to the select) instead of
 * throwing it to the error page. Retry runs in a transition: a `useSuspenseQuery` refetch outside one suspends again
 * and swaps the whole page for the fallback; inside one the page stays and `loading` is true until the answer.
 * `select` must be a stable function.
 * https://www.apollographql.com/docs/react/data/suspense#refetching-and-pagination
 */
function usePreloadedOptions<TData>(
  query: TypedDocumentNode<TData, Record<string, never>>,
  select: (data: TData) => readonly CatalogOption[],
): UseCatalogOptionsResult {
  const { data, error, refetch } = useSuspenseQuery(query, { errorPolicy: "all" });
  const [retrying, startTransition] = useTransition();
  const failed = !retrying && (error !== undefined || data === undefined);
  return {
    options: retrying || failed || data === undefined ? undefined : select(data),
    loading: retrying,
    failed,
    retry: () =>
      startTransition(async () => {
        // The error is in `error` already; the rejected promise only needs to be caught.
        await refetch().catch(() => undefined);
      }),
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
