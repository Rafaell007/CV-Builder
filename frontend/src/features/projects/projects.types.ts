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

/** What the Create project form holds while the user types. A date is `null` while the field is empty or holds text that is not a date. */
export interface CreateProjectValues {
  name: string;
  domain: string;
  startDate: Date | null;
  endDate: Date | null;
  description: string;
}

/** The checked and trimmed values the form submits: every date is a real date. */
export interface CreateProjectSubmit {
  name: string;
  domain: string;
  startDate: Date;
  endDate: Date;
  description: string;
}
