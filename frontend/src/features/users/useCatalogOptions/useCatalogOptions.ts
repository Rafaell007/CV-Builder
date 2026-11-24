"use client";

import type { ApolloClient, TypedDocumentNode } from "@apollo/client";
import { useApolloClient } from "@apollo/client/react";
import { useEffect, useState } from "react";
import type { PageInput, SortInput } from "@/shared/graphql";
import { OPTIONS_PAGE_SIZE, OPTIONS_SORT } from "../users.constants";
import type { CatalogOption } from "../users.types";

/** The variables the options loader sends. The `Departments` and `Positions` queries both accept them. */
export type CatalogOptionsVariables = { page: PageInput; sort?: SortInput | null };

/** The `{ items, total }` part of one catalog page. */
type CatalogOptionsPage = { items: readonly CatalogOption[]; total: number };

export type UseCatalogOptionsResult = {
  /** Every item of the catalog, by name. `undefined` while loading, after a failure and while disabled. */
  options: readonly CatalogOption[] | undefined;
  loading: boolean;
  /** True when a request failed. */
  failed: boolean;
  /** Loads every page again. */
  retry: () => void;
};

/** The answer of one load. `load` tells which load it belongs to, so an old answer is never shown as the new one. */
type LoadResult = { load: number; options?: readonly CatalogOption[]; failed: boolean };

/**
 * Every item of a catalog (departments, positions), for the options of a select field. The backend sends at most
 * 100 items per request, so this asks for page after page until it has `total` items. It sends nothing while
 * `enabled` is false (the modal is closed) and loads again each time `enabled` turns true, so an item that an admin
 * added a minute ago is there. `selectPage` must be a stable function (defined outside the component).
 */
export function useCatalogOptions<TData>(
  query: TypedDocumentNode<TData, CatalogOptionsVariables>,
  selectPage: (data: TData) => CatalogOptionsPage,
  enabled: boolean,
): UseCatalogOptionsResult {
  const client = useApolloClient();
  // Each load has a number. A new number starts a new load: when `enabled` turns true, and on retry.
  const [load, setLoad] = useState(0);
  const [result, setResult] = useState<LoadResult>();

  // React's "adjust state when a prop changes" pattern: done during render, so no extra effect and no stale frame.
  const [wasEnabled, setWasEnabled] = useState(enabled);
  if (enabled !== wasEnabled) {
    setWasEnabled(enabled);
    if (enabled) setLoad((number) => number + 1);
  }

  useEffect(() => {
    if (!enabled) return;
    // Like `fetch` in an effect: an answer that comes after the cleanup (modal closed, retry) is ignored.
    let ignore = false;
    loadAllPages(client, query, selectPage).then(
      (options) => {
        if (!ignore) setResult({ load, options, failed: false });
      },
      () => {
        if (!ignore) setResult({ load, failed: true });
      },
    );
    return () => {
      ignore = true;
    };
  }, [client, query, selectPage, enabled, load]);

  const current = enabled && result?.load === load ? result : undefined;
  return {
    options: current?.options,
    loading: enabled && current === undefined,
    failed: current?.failed ?? false,
    retry: () => setLoad((number) => number + 1),
  };
}

/** Asks for page 1, 2, 3… until every item is there. Any failed page makes the whole load fail. */
async function loadAllPages<TData>(
  client: ApolloClient,
  query: TypedDocumentNode<TData, CatalogOptionsVariables>,
  selectPage: (data: TData) => CatalogOptionsPage,
): Promise<CatalogOption[]> {
  const options: CatalogOption[] = [];
  for (let number = 1; ; number += 1) {
    // network-only: always the current catalog, never a copy from an earlier opening.
    const { data } = await client.query({
      query,
      variables: { page: { number, size: OPTIONS_PAGE_SIZE }, sort: OPTIONS_SORT },
      fetchPolicy: "network-only",
    });
    if (!data) throw new Error("The answer has no catalog page");
    const page = selectPage(data);
    options.push(...page.items);
    // An empty page also stops the loop: items deleted while loading must not make it ask forever.
    if (page.items.length === 0 || options.length >= page.total) return options;
  }
}
