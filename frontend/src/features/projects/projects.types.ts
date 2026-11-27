import type { ProjectsQuery } from "@/shared/graphql";

/** One row of the projects list, as the `Projects` query returns it. */
export type ProjectListItem = ProjectsQuery["projects"]["items"][number];

/** What the project form (Create and Update) holds while the user types. A date is `null` while the field is empty or holds text that is not a date. */
export interface ProjectFormValues {
  name: string;
  domain: string;
  startDate: Date | null;
  endDate: Date | null;
  description: string;
  /** The ids of the chosen skills (the technologies), in the order the user chose them. Empty is allowed. */
  environmentIds: string[];
}

/** The checked and trimmed values the form submits: every date is a real date. */
export interface ProjectFormSubmit {
  name: string;
  domain: string;
  startDate: Date;
  endDate: Date;
  description: string;
  environmentIds: string[];
}
