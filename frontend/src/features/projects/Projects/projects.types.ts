import type { ProjectsQuery } from "@/shared/graphql";

/** One row of the projects list, as the `Projects` query returns it. */
export type ProjectListItem = ProjectsQuery["projects"]["items"][number];
