import type { DepartmentsQuery } from "@/shared/graphql";

/** One row of the departments list, as the `Departments` query returns it. */
export type DepartmentListItem = DepartmentsQuery["departments"]["items"][number];
