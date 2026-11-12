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
