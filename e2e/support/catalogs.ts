import type { BrowserContext } from "@playwright/test";
import { graphql } from "./graphql";

// The largest page the backend allows (backend/src/common/pagination/page.input.ts).
const MAX_PAGE_SIZE = 100;

/** The two catalogs with the same API shape: `departments` / `createDepartment` / `deleteDepartment`, and the same for positions. */
export type Catalog = "department" | "position";

const capitalized = (catalog: Catalog) => catalog[0]!.toUpperCase() + catalog.slice(1);

/** Creates one department or position. The context must hold an Admin session. Returns the id. */
export async function createCatalogItem(
  context: BrowserContext,
  catalog: Catalog,
  name: string,
): Promise<string> {
  const field = `create${capitalized(catalog)}`;
  const data = await graphql<Record<string, { id: string }>>(
    context,
    `mutation Create($input: Create${capitalized(catalog)}Input!) { ${field}(input: $input) { id } }`,
    { input: { name } },
  );
  return data[field]!.id;
}

/**
 * Deletes every department or position whose name contains `text` (up to one page of 100), also one a test made
 * through the page. Use it in `afterEach`, so a test that failed halfway leaves nothing behind.
 */
export async function deleteCatalogItemsByName(
  context: BrowserContext,
  catalog: Catalog,
  text: string,
): Promise<void> {
  const list = `${catalog}s`;
  const data = await graphql<Record<string, { items: { id: string }[] }>>(
    context,
    `query Find($search: String, $page: PageInput!) { ${list}(search: $search, page: $page) { items { id } } }`,
    { search: text, page: { number: 1, size: MAX_PAGE_SIZE } },
  );
  for (const { id } of data[list]!.items) {
    await graphql(context, `mutation Delete($id: ID!) { delete${capitalized(catalog)}(id: $id) }`, {
      id,
    });
  }
}
