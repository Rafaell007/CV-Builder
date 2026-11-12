import type { BrowserContext } from "@playwright/test";

interface GraphqlBody<Data> {
  data?: Data;
  errors?: { message: string }[];
}

async function graphql<Data>(
  context: BrowserContext,
  query: string,
  variables: Record<string, unknown>,
): Promise<Data> {
  const response = await context.request.post("/graphql", { data: { query, variables } });
  const body = (await response.json()) as GraphqlBody<Data>;
  if (body.errors || !body.data) throw new Error(`GraphQL failed: ${body.errors?.[0]?.message}`);
  return body.data;
}

/** Creates `count` projects named `<prefix> 1`, `<prefix> 2`, ... The context must hold an Admin session. Returns the ids. */
export async function createProjects(
  context: BrowserContext,
  prefix: string,
  count: number,
): Promise<string[]> {
  const ids: string[] = [];
  for (let number = 1; number <= count; number += 1) {
    const data = await graphql<{ createProject: { id: string } }>(
      context,
      "mutation CreateProject($input: CreateProjectInput!) { createProject(input: $input) { id } }",
      {
        input: {
          name: `${prefix} ${number}`,
          domain: "E2E",
          description: "A project that an end-to-end test created.",
          startDate: "2024-01-01T00:00:00.000Z",
          endDate: "2024-12-31T00:00:00.000Z",
        },
      },
    );
    ids.push(data.createProject.id);
  }
  return ids;
}

/** Deletes the projects of `createProjects`, so the other specs see the seed data again. */
export async function deleteProjects(context: BrowserContext, ids: string[]): Promise<void> {
  for (const id of ids) {
    await graphql(context, "mutation DeleteProject($id: ID!) { deleteProject(id: $id) }", { id });
  }
}
