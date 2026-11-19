import { ADMIN_ONLY_USER_TABS, USER_TABS } from "../user-details.constants";
import type { UserTab } from "../user-details.types";

/** The route of one tab of a user. The locale-aware router adds the language. */
export function toUserTabPath(userId: string, tab: UserTab): string {
  return `/users/${userId}/${tab}`;
}

/** The tabs this role may open. Hiding a tab is only a convenience: the backend checks every request. */
export function getUserTabs(isAdmin: boolean): UserTab[] {
  return USER_TABS.filter((tab) => isAdmin || !ADMIN_ONLY_USER_TABS.includes(tab));
}
