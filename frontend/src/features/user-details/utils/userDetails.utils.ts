import { readFailure } from "@/shared/failures";
import { USER_TABS } from "../user-details.constants";
import type { UserTab } from "../user-details.types";

/** The route of one tab of a user. The locale-aware router adds the language. */
export function toUserTabPath(userId: string, tab: UserTab): string {
  return `/users/${userId}/${tab}`;
}

/** The tabs this role may open: only an Admin sees the CVs tab. Hiding a tab is only a convenience: the backend checks every request. */
export function getUserTabs(isAdmin: boolean): UserTab[] {
  return USER_TABS.filter((tab) => isAdmin || tab !== "cvs");
}

/**
 * Whether a failed `user(id)` query means there is no such user: `NOT_FOUND`, or `BAD_USER_INPUT` (an id that is not
 * a UUID, so no user can have it). Any other failure (network, server) is not "not found" and can be retried.
 */
export function isUserNotFound(error: unknown): boolean {
  const { kind } = readFailure(error);
  return kind === "notFound" || kind === "invalid";
}
