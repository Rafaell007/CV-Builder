import { DEFAULT_PAGE_SIZE } from "@/shared/components";
import type { CvsQueryVariables } from "@/shared/graphql";
import type { CvsListState, CvTab } from "../cvs.types";

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

/** The route of one tab of a CV. The locale-aware router adds the language. `from` is the page to return to (see `toCvReturnPath`). */
export function toCvTabPath(cvId: string, tab: CvTab, from?: string): string {
  const path = `/cvs/${cvId}/${tab}`;
  return from === undefined ? path : `${path}?${new URLSearchParams({ from })}`;
}

/** The User CVs tab of an employee: the page that a CV opened from it returns to. */
export function toUserCvsPath(userId: string): string {
  return `/users/${userId}/cvs`;
}

// Only the User CVs tab may be a return target. The value comes from the address, so anything else
// (another site, another page, a path with extra parts) is dropped: the link would be an open redirect.
const USER_CVS_PATH = /^\/users\/[A-Za-z0-9_-]+\/cvs$/;

/** The `from` value of the address if it is a User CVs tab path, otherwise `undefined`. */
export function toCvReturnPath(value: string | null | undefined): string | undefined {
  return typeof value === "string" && USER_CVS_PATH.test(value) ? value : undefined;
}
