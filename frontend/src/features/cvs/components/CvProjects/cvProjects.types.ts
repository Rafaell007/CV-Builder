import type { SortState } from "@/shared/components";
import type {
  AvailableCvProjectsQuery,
  CvProjectsQuery,
  ProjectRolesQuery,
} from "@/shared/graphql";

/** One project of a CV, as the `CvProjects` query returns it. `id` is the CV-project link, `project.id` the catalog project. */
export type CvProjectItem = CvProjectsQuery["cvProjects"][number];

/** One project of the catalog that is not yet in the CV, as the Add project modal offers it. */
export type CatalogProject = AvailableCvProjectsQuery["availableCvProjects"][number];

/** One role that a person can have in a project. */
export type ProjectRoleItem = ProjectRolesQuery["projectRoles"][number];

/** What the user chose for the list: the search text and the sort (the Name column ascending at the start). */
export interface CvProjectsListState {
  search: string;
  sort: SortState;
}

/** The days a catalog project lasts. A CV project must stay inside them (AC-15). */
export interface ProjectRange {
  start: Date;
  end: Date;
}

/**
 * What the CV project form holds while the user types. A date is `null` while the field is empty and when the
 * typed text is not a date. The end date may stay empty: the person still works on the project (shown as Till now).
 */
export interface CvProjectFormValues {
  projectId: string;
  startDate: Date | null;
  endDate: Date | null;
  roleIds: string[];
  responsibilities: string;
}

/** The checked values the form submits: the start date is a real date, the responsibilities are trimmed. */
export interface CvProjectFormSubmit {
  projectId: string;
  startDate: Date;
  endDate: Date | null;
  roleIds: string[];
  responsibilities: string;
}
