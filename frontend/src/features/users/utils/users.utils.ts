import { CombinedGraphQLErrors } from "@apollo/client";
import { SELF_DELETE_REASON } from "../users.constants";
import type { UserListItem } from "../users.types";

type NamedUser = Pick<UserListItem, "email" | "firstName" | "lastName">;

/**
 * The name to show for a user: first and last name, or only the one that is filled. A user who signed up and never
 * filled the profile has no name, so the email stands in for it (the avatar initials, the menu and delete texts).
 */
export function getUserDisplayName({ email, firstName, lastName }: NamedUser): string {
  const name = [firstName, lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");
  return name || email;
}

/** The profile page of a user (the employee arrow, row click and View). */
export const toUserProfilePath = (userId: string): string => `/users/${userId}/profile`;

/** Why `deleteUser` failed, for the error toast. */
export type DeleteUserFailure = "self" | "notFound" | "forbidden";

/**
 * Reads the reason of a failed `deleteUser`: the admin's own account (`CONFLICT` with `reason: "SELF_DELETE"`, D24),
 * a user deleted meanwhile (`NOT_FOUND`) or a lost admin role (`FORBIDDEN`). Anything else is `undefined`. The backend
 * message is not shown: it is English only, so the caller picks a translated text.
 */
export function toDeleteUserFailure(error: unknown): DeleteUserFailure | undefined {
  if (!CombinedGraphQLErrors.is(error)) return undefined;
  const extensions = error.errors[0]?.extensions;
  const code = extensions?.["code"];
  if (code === "CONFLICT" && extensions?.["reason"] === SELF_DELETE_REASON) return "self";
  if (code === "NOT_FOUND") return "notFound";
  if (code === "FORBIDDEN") return "forbidden";
  return undefined;
}
