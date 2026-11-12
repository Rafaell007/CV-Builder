import { DEFAULT_PAGE_SIZE } from "@/shared/components";
import type { ProjectsQueryVariables } from "@/shared/graphql";
import type { ProjectsListState } from "../projects.types";

/**
 * Turns the choices of the user into the variables of the `Projects` query.
 * The page size is always sent: the backend default is 20 and the table pages hold 10 rows.
 * An empty search and no sort are left out, not sent as null: the backend fails with an internal error for
 * `sort: null` (see backend/src/common/pagination/README.md). Without them it returns every project, sorted by name.
 */
export function toProjectsVariables({
  search,
  sort,
  page,
}: ProjectsListState): ProjectsQueryVariables {
  const text = search.trim();
  return {
    page: { number: page, size: DEFAULT_PAGE_SIZE },
    ...(text === "" ? {} : { search: text }),
    ...(sort === undefined ? {} : { sort }),
  };
}
