import type { BrowserContext } from "@playwright/test";
import { graphql } from "./graphql";

// The largest page the backend allows (backend/src/common/pagination/page.input.ts).
const MAX_PAGE_SIZE = 100;

/**
 * Creates one skill in the category with this name (a seed category, backend/prisma/seed/catalogs.data.ts). The context
 * must hold an Admin session. Returns the id.
 */
export async function createSkill(
  context: BrowserContext,
  name: string,
  categoryName: string,
): Promise<string> {
  const { skillCategories } = await graphql<{ skillCategories: { id: string; name: string }[] }>(
    context,
    "query Categories { skillCategories { id name } }",
    {},
  );
  const category = skillCategories.find((candidate) => candidate.name === categoryName);
  if (!category) throw new Error(`No skill category named ${categoryName}`);
  const { createSkill: created } = await graphql<{ createSkill: { id: string } }>(
    context,
    "mutation Create($input: CreateSkillInput!) { createSkill(input: $input) { id } }",
    { input: { name, categoryId: category.id } },
  );
  return created.id;
}

/**
 * Deletes every skill whose name contains `text` (up to one page of 100), also one a test made through the page. Use
 * it in `afterEach`, so a test that failed halfway leaves nothing behind.
 */
export async function deleteSkillsByName(context: BrowserContext, text: string): Promise<void> {
  const { skillCatalog } = await graphql<{ skillCatalog: { items: { id: string }[] } }>(
    context,
    "query Find($search: String, $page: PageInput!) { skillCatalog(search: $search, page: $page) { items { id } } }",
    { search: text, page: { number: 1, size: MAX_PAGE_SIZE } },
  );
  for (const { id } of skillCatalog.items) {
    await graphql(context, "mutation Delete($id: ID!) { deleteSkill(id: $id) }", { id });
  }
}
