import { DEFAULT_PAGE_SIZE } from "@/shared/components";
import type { CvsQueryVariables } from "@/shared/graphql";
import { CV_TABS } from "../cvs.constants";
import type { CvsListState, CvTab } from "../cvs.types";

/**
 * The employee scope of a request: `{ userId }` for the User CVs tab, `{}` otherwise.
 * With exactOptionalPropertyTypes the key must be left out, not set to `undefined`.
 */
export function withScope(userId?: string): { userId?: string } {
  return userId === undefined ? {} : { userId };
}

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
    ...withScope(userId),
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

/** The route that opens a CV from the list. On the User CVs tab (`userId`) it remembers the tab, so the CV page can lead back to it. */
export function toCvOpenPath(cvId: string, userId?: string): string {
  return toCvTabPath(cvId, "preview", userId === undefined ? undefined : toUserCvsPath(userId));
}

/** One tab of a CV: its `path` (no query, used to find the active tab) and its `href` (keeps `from`, used for the link). */
export interface CvTabLink {
  tab: CvTab;
  path: string;
  href: string;
}

/** All tabs of a CV, in order. `from` is the checked return path (see `toCvReturnPath`). */
export function toCvTabLinks(cvId: string, from?: string): CvTabLink[] {
  return CV_TABS.map((tab) => ({
    tab,
    path: toCvTabPath(cvId, tab),
    href: toCvTabPath(cvId, tab, from),
  }));
}

/**
 * The route to give to the shared `Tabs` as the current one. The tab links keep `?from=...` and `Tabs` compares
 * the route with the whole link, so the current route needs the same query.
 */
export function toActiveTabHref(pathname: string, from?: string): string {
  return from === undefined ? pathname : `${pathname}?${new URLSearchParams({ from })}`;
}
