import type { SortState } from "@/shared/components";
import type { ProjectsQuery } from "@/shared/graphql";

/** One row of the projects list, as the `Projects` query returns it. */
export type ProjectListItem = ProjectsQuery["projects"]["items"][number];

/** What the user chose for the list: the search text, the sort (the Name column ascending at the start) and the page (starts at 1). */
export interface ProjectsListState {
  search: string;
  sort: SortState;
  page: number;
}
