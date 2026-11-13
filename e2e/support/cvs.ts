import type { BrowserContext } from "@playwright/test";
import { graphql } from "./graphql";

// The largest page the backend allows (backend/src/common/pagination/page.input.ts).
const MAX_PAGE_SIZE = 100;

const CREATE_CV = "mutation CreateCv($input: CreateCvInput!) { createCv(input: $input) { id } }";

/** Creates `count` CVs named `<prefix> 1`, `<prefix> 2`, ... for the user of the session. Returns the ids. */
export async function createCvs(
  context: BrowserContext,
  prefix: string,
  count: number,
): Promise<string[]> {
  const ids: string[] = [];
  for (let number = 1; number <= count; number += 1) {
    const data = await graphql<{ createCv: { id: string } }>(context, CREATE_CV, {
      input: {
        name: `${prefix} ${number}`,
        education: "E2E",
        description: "A CV that an end-to-end test created.",
      },
    });
    ids.push(data.createCv.id);
  }
  return ids;
}

/**
 * Deletes every CV of the session user whose name contains `text` (up to one page of 100), also a CV that a test made
 * through the page. Use it in `afterEach`, so a test that failed halfway leaves no CV behind.
 */
export async function deleteCvsByName(context: BrowserContext, text: string): Promise<void> {
  const data = await graphql<{ cvs: { items: { id: string }[] } }>(
    context,
    "query Find($search: String, $page: PageInput!) { cvs(search: $search, page: $page) { items { id } } }",
    { search: text, page: { number: 1, size: MAX_PAGE_SIZE } },
  );
  for (const { id } of data.cvs.items) {
    await graphql(context, "mutation DeleteCv($id: ID!) { deleteCv(id: $id) { id } }", { id });
  }
}
