"use client";

import { useState } from "react";
import type { SortState } from "@/shared/components";
import { DEFAULT_PROJECTS_SORT } from "../projects.constants";
import type { ProjectsListState } from "../projects.types";

export type UseProjectsListStateResult = ProjectsListState & {
  /** A new search shows the first page of the new result. The same search again (also with other spaces around it) changes nothing. */
  setSearch: (search: string) => void;
  /** A new sort shows the first page of the new order. */
  setSort: (sort: SortState) => void;
  setPage: (page: number) => void;
};

const INITIAL_STATE: ProjectsListState = { search: "", sort: DEFAULT_PROJECTS_SORT, page: 1 };

/** Holds what the user chose for the projects list: search, sort and page. Nothing is filtered or sorted here. */
export function useProjectsListState(): UseProjectsListStateResult {
  const [state, setState] = useState<ProjectsListState>(INITIAL_STATE);

  return {
    ...state,
    setSearch: (search) =>
      // The query sends the trimmed text, so a change of spaces only is not a new search and keeps the page.
      setState((current) =>
        current.search.trim() === search.trim() ? current : { ...current, search, page: 1 },
      ),
    setSort: (sort) => setState((current) => ({ ...current, sort, page: 1 })),
    setPage: (page) => setState((current) => ({ ...current, page })),
  };
}
