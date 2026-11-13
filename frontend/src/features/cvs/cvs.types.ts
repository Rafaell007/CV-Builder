import type { SortState } from "@/shared/components";
import type { CvQuery, CvsQuery } from "@/shared/graphql";

/** One row of the CVs list, as the `Cvs` query returns it. */
export type CvListItem = CvsQuery["cvs"]["items"][number];

/** The CV of the CV Details page, as the `Cv` query returns it. */
export type CvDetailsData = CvQuery["cv"];

/** What the user chose for the list: the search text, the sort (the Name column ascending at the start) and the page (starts at 1). */
export interface CvsListState {
  search: string;
  sort: SortState;
  page: number;
}

/** What the CV form (Create and Update) holds while the user types. */
export interface CvFormValues {
  name: string;
  education: string;
  description: string;
}
