import type { BrowserContext } from "@playwright/test";

interface GraphqlBody<Data> {
  data?: Data;
  errors?: { message: string }[];
}

/** Sends one query or mutation through the frontend's /graphql with the cookies of the context. Throws on a GraphQL error. */
export async function graphql<Data>(
  context: BrowserContext,
  query: string,
  variables: Record<string, unknown>,
): Promise<Data> {
  const response = await context.request.post("/graphql", { data: { query, variables } });
  const body = (await response.json()) as GraphqlBody<Data>;
  if (body.errors || !body.data) throw new Error(`GraphQL failed: ${body.errors?.[0]?.message}`);
  return body.data;
}
