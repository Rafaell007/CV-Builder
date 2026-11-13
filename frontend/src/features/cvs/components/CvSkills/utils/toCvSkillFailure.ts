import { CombinedGraphQLErrors } from "@apollo/client";

/** Why adding, changing or removing a CV skill failed, when the reason is one the user can act on. */
export type CvSkillFailure = "notFound" | "forbidden" | "conflict" | "invalid";

/**
 * Reads the reason of a failed CV skill request. The backend codes:
 * - `NOT_FOUND`: the CV or the link is gone, or it belongs to another user (the backend gives the same answer).
 * - `FORBIDDEN`: the role, or an unverified email, does not allow the change.
 * - `CONFLICT`: the skill is already in the CV (the same skill added twice).
 * - `BAD_USER_INPUT`: the owner of the CV does not have the skill.
 * Any other failure (network, server) returns `undefined`, and the caller shows its own friendly text.
 * The backend message is not shown: the caller picks a translated text for each reason.
 */
export function toCvSkillFailure(error: unknown): CvSkillFailure | undefined {
  if (!CombinedGraphQLErrors.is(error)) return undefined;
  const codes = error.errors.map((item) => item.extensions?.["code"]);
  if (codes.includes("NOT_FOUND")) return "notFound";
  if (codes.includes("FORBIDDEN")) return "forbidden";
  if (codes.includes("CONFLICT")) return "conflict";
  if (codes.includes("BAD_USER_INPUT")) return "invalid";
  return undefined;
}
