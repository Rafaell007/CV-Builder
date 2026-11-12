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

const CREATE_PROJECT =
  "mutation CreateProject($input: CreateProjectInput!) { createProject(input: $input) { id } }";

function projectInput(name: string) {
  return {
    name,
    domain: "E2E",
    description: "A project that an end-to-end test created.",
    startDate: "2024-01-01T00:00:00.000Z",
    endDate: "2024-12-31T00:00:00.000Z",
  };
}

/** Creates `count` projects named `<prefix> 1`, `<prefix> 2`, ... The context must hold an Admin session. Returns the ids. */
export async function createProjects(
  context: BrowserContext,
  prefix: string,
  count: number,
): Promise<string[]> {
  const ids: string[] = [];
  for (let number = 1; number <= count; number += 1) {
    const data = await graphql<{ createProject: { id: string } }>(context, CREATE_PROJECT, {
      input: projectInput(`${prefix} ${number}`),
    });
    ids.push(data.createProject.id);
  }
  return ids;
}

/** Creates one project with the given name. The context must hold an Admin session. Returns the id. */
export async function createProject(context: BrowserContext, name: string): Promise<string> {
  const data = await graphql<{ createProject: { id: string } }>(context, CREATE_PROJECT, {
    input: projectInput(name),
  });
  return data.createProject.id;
}

/**
 * Deletes every project whose name contains `text`, whatever way it was created (also through the page).
 * Use it in `afterEach`, so a test that failed half way leaves no project behind.
 */
export async function deleteProjectsByName(context: BrowserContext, text: string): Promise<void> {
  const data = await graphql<{ projects: { items: { id: string }[] } }>(
    context,
    "query Find($search: String) { projects(search: $search) { items { id } } }",
    { search: text },
  );
  await deleteProjects(
    context,
    data.projects.items.map((project) => project.id),
  );
}

/** Deletes the projects of `createProjects`, so the other specs see the seed data again. */
export async function deleteProjects(context: BrowserContext, ids: string[]): Promise<void> {
  for (const id of ids) {
    await graphql(context, "mutation DeleteProject($id: ID!) { deleteProject(id: $id) }", { id });
  }
}
