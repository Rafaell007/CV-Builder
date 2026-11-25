import type { OperationVariables, TypedDocumentNode } from "@apollo/client";
import type { PreloadQueryProps } from "@apollo/client-integration-nextjs";
import { connection } from "next/server";
import type { ReactNode } from "react";
import { WaitForQuery } from "../WaitForQuery";
import { PreloadQuery } from "./apolloServerClient";

export interface PrefetchQueryProps<TData, TVariables extends OperationVariables> {
  query: TypedDocumentNode<TData, TVariables>;
  /** The variables that the children's `useQuery` sends first. Other variables miss the cache. */
  variables?: TVariables;
  children: ReactNode;
}

/**
 * Runs `query` on the server with the user's cookies (PLAN D6) and renders `children` once the result is in the
 * browser's Apollo cache. The children's own `useQuery` (same query, same variables) finds it there, also while the
 * page renders on the server: the server HTML shows the data, and the browser does not ask again.
 * It must render inside `<Suspense>` (the build fails otherwise): the `(app)` layout has one around every protected
 * page, so a page needs none of its own. Nest two to have both results.
 */
export async function PrefetchQuery<TData, TVariables extends OperationVariables>({
  query,
  variables,
  children,
}: PrefetchQueryProps<TData, TVariables>) {
  // The cookies make the data per request; without this, Cache Components would run the query at build time.
  await connection();
  // errorPolicy "all": a failed query does not throw. The children's hooks send it again in the browser and show
  // their own error state (with Retry, or the redirect to sign-in of the session link).
  // The cast: PreloadQuery makes `variables` required or optional from the query, which a generic wrapper cannot prove.
  const props = {
    query,
    errorPolicy: "all",
    ...(variables === undefined ? {} : { variables }),
    children: (queryRef) => <WaitForQuery queryRef={queryRef}>{children}</WaitForQuery>,
  } as PreloadQueryProps<TData, TVariables>;
  return <PreloadQuery {...props} />;
}
