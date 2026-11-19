import type { CvsQueryVariables } from "@/shared/graphql";
import { toListVariables, type ListState } from "@/shared/lists";
import type { CvTab } from "../cvs.types";

/**
 * Turns the choices of the user into the variables of the `Cvs` query: the shared list variables (page, sort,
 * trimmed search), plus `userId` (the CVs of one user, for the User CVs tab) only when it is given.
 * Without `userId` the backend returns every CV the user may see.
 */
export function toCvsVariables(list: ListState, userId?: string): CvsQueryVariables {
  return {
    ...toListVariables(list),
    ...(userId === undefined ? {} : { userId }),
  };
}

/** The route of one tab of a CV. The locale-aware router adds the language. */
export function toCvTabPath(cvId: string, tab: CvTab): string {
  return `/cvs/${cvId}/${tab}`;
}
