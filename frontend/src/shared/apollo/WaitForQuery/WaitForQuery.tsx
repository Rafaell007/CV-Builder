"use client";

import type { OperationVariables } from "@apollo/client";
import { useReadQuery, type QueryRef } from "@apollo/client/react";
import type { ReactNode } from "react";

export interface WaitForQueryProps {
  // "empty": with errorPolicy "all", a failed query has no data.
  queryRef: QueryRef<unknown, OperationVariables, "complete" | "streaming" | "empty">;
  children: ReactNode;
}

/**
 * Suspends until the query of `queryRef` has its result in the Apollo cache, then renders `children`. The children
 * read that result with their own `useQuery`, also while the page renders on the server, so the server HTML holds
 * the data and the browser sends no request for it. Used by `PrefetchQuery` (`@/shared/apollo/server`).
 */
export function WaitForQuery({ queryRef, children }: WaitForQueryProps) {
  useReadQuery(queryRef);
  return children;
}
