import { CombinedGraphQLErrors } from "@apollo/client";
import type { CvProjectsQueryVariables } from "@/shared/graphql";
import type { CvProjectsListState } from "../cvProjects.types";

/**
 * Turns the choices of the user into the variables of the `CvProjects` query.
 * The sort is always sent: the list starts sorted by name ascending and a click only switches direction or column.
 * An empty search is left out. Without it the backend returns every project of the CV.
 */
export function toCvProjectsVariables(
  cvId: string,
  { search, sort }: CvProjectsListState,
): CvProjectsQueryVariables {
  const text = search.trim();
  return { cvId, sort, ...(text === "" ? {} : { search: text }) };
}

/** Why adding, changing or removing a CV project failed, when the reason is one the user can act on. */
export type CvProjectFailure = "notFound" | "forbidden" | "conflict" | "invalid";

/**
 * Reads the reason of a failed CV project request. The backend codes:
 * - `NOT_FOUND`: the CV or the entry is gone, or it belongs to another user (the backend gives the same answer).
 * - `FORBIDDEN`: the role, or an unverified email, does not allow the change.
 * - `CONFLICT`: the project is already in the CV, or a project date changed at the same moment (try again).
 * - `BAD_USER_INPUT`: a date, a role or the project is not valid. The field errors are shown under the fields.
 * Any other failure (network, server) returns `undefined`, and the caller shows its own friendly text.
 * The backend message is not shown: the caller picks a translated text for each reason.
 */
export function toCvProjectFailure(error: unknown): CvProjectFailure | undefined {
  if (!CombinedGraphQLErrors.is(error)) return undefined;
  const codes = error.errors.map((item) => item.extensions?.["code"]);
  if (codes.includes("NOT_FOUND")) return "notFound";
  if (codes.includes("FORBIDDEN")) return "forbidden";
  if (codes.includes("CONFLICT")) return "conflict";
  if (codes.includes("BAD_USER_INPUT")) return "invalid";
  return undefined;
}
