"use client";

import { ProjectsDocument, type ProjectsQueryVariables } from "@/shared/graphql";
import { usePagedList, type UsePagedListResult } from "@/shared/lists";
import type { ProjectListItem } from "../projects.types";

export type UseProjectsResult = Omit<UsePagedListResult<ProjectListItem>, "items"> & {
  /** The rows of the current page, as the backend returned them. */
  projects: readonly ProjectListItem[];
};

/** Loads one page of projects with the `Projects` query (the shared `usePagedList`). The backend searches, sorts and cuts the page. */
export function useProjects(variables: ProjectsQueryVariables): UseProjectsResult {
  const { items, ...list } = usePagedList(ProjectsDocument, variables, (data) => data.projects);
  return { projects: items, ...list };
}
