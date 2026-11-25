import type { Locale } from "next-intl";
import { readFailure } from "@/shared/failures";
import type { Role } from "@/shared/graphql";
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
 * Whether the signed-in user may change this profile (PLAN §8): the owner, or any Admin. `null` when no one is signed
 * in. Hiding the form controls is only a convenience: the backend checks every `updateProfile` itself.
 */
export function canEditProfile(
  me: { id: string; role: Role } | null | undefined,
  userId: string,
): boolean {
  if (!me) return false;
  return me.id === userId || me.role === "ADMIN";
}

/**
 * Whether a failed `user(id)` query means there is no such user: `NOT_FOUND`, or `BAD_USER_INPUT` (an id that is not
 * a UUID, so no user can have it). Any other failure (network, server) is not "not found" and can be retried.
 */
export function isUserNotFound(error: unknown): boolean {
  const { kind } = readFailure(error);
  return kind === "notFound" || kind === "invalid";
}

/**
 * The day a user joined, for "A member since …", with the rules of the language: `Sun, Jan 14, 2024` in English,
 * `niedz., 14 sty 2024` in Polish. Read in UTC, so the server HTML and the browser show the same day (no hydration
 * mismatch); near midnight it can be the day before or after the local one. `null` for a value that is not a date.
 */
export function formatMemberSince(createdAt: string, locale: Locale): string | null {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
