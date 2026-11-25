import { readFailure } from "@/shared/failures";
import { USER_TABS } from "../user-details.constants";
import type { UserLayoutView, UserTab } from "../user-details.types";

/** The route of one tab of a user. The locale-aware router adds the language. */
export function toUserTabPath(userId: string, tab: UserTab): string {
  return `/users/${userId}/${tab}`;
}

/** The tabs this role may open: only an Admin sees the CVs tab. Hiding a tab is only a convenience: the backend checks every request. */
export function getUserTabs(isAdmin: boolean): UserTab[] {
  return USER_TABS.filter((tab) => isAdmin || tab !== "cvs");
}

/**
 * What the shell shows after the `user(id)` query. Data first: a failed refresh must not replace a page that is
 * already shown. `NOT_FOUND` and `BAD_USER_INPUT` (an id that is not a UUID, so no user can have it) are "not
 * found"; any other failure (network, server) can be retried.
 */
export function toUserLayoutView(hasUser: boolean, error: unknown): UserLayoutView {
  if (hasUser) return "ready";
  const { kind } = readFailure(error);
  return kind === "notFound" || kind === "invalid" ? "notFound" : "failed";
}
