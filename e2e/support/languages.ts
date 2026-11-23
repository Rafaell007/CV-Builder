import type { BrowserContext } from "@playwright/test";
import { graphql } from "./graphql";

// The largest page the backend allows (backend/src/common/pagination/page.input.ts).
const MAX_PAGE_SIZE = 100;

/** What `createLanguage` needs. The backend uppercases the ISO code. */
export interface LanguageValues {
  name: string;
  iso: string;
  nativeName: string;
}

/** Creates one language. The context must hold an Admin session. Returns the id. */
export async function createLanguage(
  context: BrowserContext,
  input: LanguageValues,
): Promise<string> {
  const { createLanguage: created } = await graphql<{ createLanguage: { id: string } }>(
    context,
    "mutation Create($input: CreateLanguageInput!) { createLanguage(input: $input) { id } }",
    { input },
  );
  return created.id;
}

/**
 * Deletes every language whose name contains `text` (up to one page of 100), also one a test made through the page.
 * Use it in `afterEach`, so a test that failed halfway leaves nothing behind.
 */
export async function deleteLanguagesByName(context: BrowserContext, text: string): Promise<void> {
  const { languages } = await graphql<{ languages: { items: { id: string }[] } }>(
    context,
    "query Find($search: String, $page: PageInput!) { languages(search: $search, page: $page) { items { id } } }",
    { search: text, page: { number: 1, size: MAX_PAGE_SIZE } },
  );
  for (const { id } of languages.items) {
    await deleteLanguage(context, id);
  }
}

/**
 * Deletes every language whose ISO code starts with `prefix` (among the first 100 languages). The search looks at
 * names only, so this catches a test language whose name has no common text (e.g. "ENGLISH" made by a failed test).
 * Use it in `afterEach`.
 */
export async function deleteLanguagesByIsoPrefix(
  context: BrowserContext,
  prefix: string,
): Promise<void> {
  const { languages } = await graphql<{ languages: { items: { id: string; iso: string }[] } }>(
    context,
    "query All($page: PageInput!) { languages(page: $page) { items { id iso } } }",
    { page: { number: 1, size: MAX_PAGE_SIZE } },
  );
  for (const { id, iso } of languages.items) {
    if (iso.startsWith(prefix)) await deleteLanguage(context, id);
  }
}

async function deleteLanguage(context: BrowserContext, id: string): Promise<void> {
  await graphql(context, "mutation Delete($id: ID!) { deleteLanguage(id: $id) }", { id });
}
