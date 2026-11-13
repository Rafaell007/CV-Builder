import { CombinedGraphQLErrors } from "@apollo/client";
import { DEFAULT_PAGE_SIZE } from "@/shared/components";
import type { ProjectsQueryVariables } from "@/shared/graphql";
import type { ProjectsListState } from "../projects.types";

/**
 * Turns the choices of the user into the variables of the `Projects` query.
 * The page size is always sent (10, the same as the backend default), so the page buttons never depend on the backend default.
 * The sort is always sent: the list starts sorted by name ascending and a click only switches direction or column.
 * An empty search is left out. Without it the backend returns every project.
 */
export function toProjectsVariables({
  search,
  sort,
  page,
}: ProjectsListState): ProjectsQueryVariables {
  const text = search.trim();
  return {
    page: { number: page, size: DEFAULT_PAGE_SIZE },
    sort,
    ...(text === "" ? {} : { search: text }),
  };
}

/**
 * The message to show when `deleteProject` fails. A business-rule error (`CONFLICT`, for example "used in a CV")
 * carries a message written for the user, so it is shown as it is. Any other failure (network, server, permission)
 * returns `undefined`, and the caller shows its own friendly text.
 */
export function toDeleteProjectFailure(error: unknown): string | undefined {
  if (!CombinedGraphQLErrors.is(error)) return undefined;
  return error.errors.find((item) => item.extensions?.["code"] === "CONFLICT")?.message;
}
