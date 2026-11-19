"use client";

import type { ErrorLike, OperationVariables, TypedDocumentNode } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import type { PagedResult } from "../lists.types";

export type UsePagedListResult<TItem> = {
  /** The rows of the current page, as the backend returned them. */
  items: readonly TItem[];
  /** Number of rows that match the search, on all pages. It keeps the last value while a new page loads. */
  total: number;
  loading: boolean;
  /** True when the request failed. The list is then not shown, so a failure never looks like an empty list. */
  failed: boolean;
  /** The error of the failed request (`undefined` otherwise), for a page that tells failures apart, e.g. `FORBIDDEN`. */
  error: ErrorLike | undefined;
  /** Sends the failed request again, with the same search, sort and page. */
  retry: () => void;
};

/**
 * Loads one page of a list query. The backend searches, sorts and cuts the page.
 * `selectPage` picks the `{ items, total }` part out of the query result, for example `(data) => data.projects`.
 */
export function usePagedList<TData, TVariables extends OperationVariables, TItem>(
  query: TypedDocumentNode<TData, TVariables>,
  variables: TVariables,
  selectPage: (data: TData) => PagedResult<TItem>,
): UsePagedListResult<TItem> {
  // notifyOnNetworkStatusChange: `loading` is true again during a retry, so the page shows the skeleton.
  const { data, previousData, loading, error, refetch } = useQuery(query, {
    variables,
    notifyOnNetworkStatusChange: true,
  });
  // While the next page loads, the page buttons stay (no jump); they use the total of the previous result.
  const lastData = data ?? previousData;

  return {
    items: data === undefined ? [] : selectPage(data).items,
    total: lastData === undefined ? 0 : selectPage(lastData).total,
    loading,
    failed: error !== undefined,
    error,
    // The error is already in the hook state, so the rejected promise of refetch needs no second handler.
    retry: () => void refetch().catch(() => undefined),
  };
}
