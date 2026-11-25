import { CombinedGraphQLErrors } from "@apollo/client";
import { CONCURRENT_CHANGE_REASON } from "@/shared/userProfile";
import { SELF_DELETE_REASON } from "../users.constants";

/** The profile page of a user (the employee arrow, row click and View). */
export const toUserProfilePath = (userId: string): string => `/users/${userId}/profile`;

/** Why `deleteUser` failed, for the error toast. */
export type DeleteUserFailure = "self" | "notFound" | "forbidden" | "concurrentChange";

/**
 * Reads the reason of a failed `deleteUser`: the admin's own account (`CONFLICT` with `reason: "SELF_DELETE"`, D24),
 * a user deleted meanwhile (`NOT_FOUND`), a lost admin role (`FORBIDDEN`) or a change of the same user at the same
 * time (`CONFLICT` with `reason: "CONCURRENT_CHANGE"`, nothing deleted). Anything else is `undefined`. The backend
 * message is not shown: it is English only, so the caller picks a translated text.
 */
export function toDeleteUserFailure(error: unknown): DeleteUserFailure | undefined {
  if (!CombinedGraphQLErrors.is(error)) return undefined;
  const extensions = error.errors[0]?.extensions;
  const code = extensions?.["code"];
  if (code === "CONFLICT" && extensions?.["reason"] === SELF_DELETE_REASON) return "self";
  if (code === "CONFLICT" && extensions?.["reason"] === CONCURRENT_CHANGE_REASON)
    return "concurrentChange";
  if (code === "NOT_FOUND") return "notFound";
  if (code === "FORBIDDEN") return "forbidden";
  return undefined;
}
