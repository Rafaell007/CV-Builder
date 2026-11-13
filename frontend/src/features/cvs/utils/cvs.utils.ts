import { DEFAULT_PAGE_SIZE } from "@/shared/components";
import type { CvsQueryVariables } from "@/shared/graphql";
import type { CvsListState } from "../cvs.types";

/**
 * Turns the choices of the user into the variables of the `Cvs` query.
 * The page size is always sent (10, the same as the backend default), so the page buttons never depend on the backend default.
 * The sort is always sent: the list starts sorted by name ascending and a click only switches direction.
 * An empty search is left out. Without it the backend returns every CV the user may see.
 * `userId` (the CVs of one user, for the User CVs tab) is sent only when it is given.
 */
export function toCvsVariables(
  { search, sort, page }: CvsListState,
  userId?: string,
): CvsQueryVariables {
  const text = search.trim();
  return {
    page: { number: page, size: DEFAULT_PAGE_SIZE },
    sort,
    ...(text === "" ? {} : { search: text }),
    ...(userId === undefined ? {} : { userId }),
  };
}

/** The CV Details page of a CV. The locale-aware router adds the language. */
export function toCvDetailsPath(cvId: string): string {
  return `/cvs/${cvId}/details`;
}
