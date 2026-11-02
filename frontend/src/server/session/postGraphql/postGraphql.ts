import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { print } from "graphql";

export type GraphqlResult<TData> = {
  data: TData | null;
  // `extensions.code` of every GraphQL error, e.g. UNAUTHENTICATED.
  errorCodes: string[];
  // Raw `Set-Cookie` headers of the answer; the caller passes them on to the browser.
  setCookies: string[];
};

type GraphqlBody<TData> = {
  data?: TData | null;
  errors?: { extensions?: { code?: string } }[];
};

/**
 * Sends one operation to the backend with the user's cookies. A network failure or a non-JSON answer
 * throws; GraphQL errors are returned as `errorCodes`.
 */
export async function postGraphql<TData, TVariables extends Record<string, never>>(
  backendUrl: string,
  document: TypedDocumentNode<TData, TVariables>,
  cookieHeader: string,
): Promise<GraphqlResult<TData>> {
  const response = await fetch(`${backendUrl}/graphql`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(cookieHeader && { cookie: cookieHeader }) },
    body: JSON.stringify({ query: print(document) }),
    cache: "no-store",
  });
  const body = (await response.json()) as GraphqlBody<TData>;
  return {
    data: body.data ?? null,
    errorCodes: (body.errors ?? []).map((error) => error.extensions?.code ?? "UNKNOWN"),
    setCookies: response.headers.getSetCookie(),
  };
}
