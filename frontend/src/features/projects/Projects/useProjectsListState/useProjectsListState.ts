"use client";

import { useState } from "react";
import type { SortState } from "@/shared/components";
import type { ProjectsListState } from "../projects.types";

export type UseProjectsListStateResult = ProjectsListState & {
  /** A new search shows the first page of the new result. The same search again changes nothing. */
  setSearch: (search: string) => void;
  /** A new sort shows the first page of the new order. */
  setSort: (sort: SortState | undefined) => void;
  setPage: (page: number) => void;
};

const INITIAL_STATE: ProjectsListState = { search: "", sort: undefined, page: 1 };

/** Holds what the user chose for the projects list: search, sort and page. Nothing is filtered or sorted here. */
export function useProjectsListState(): UseProjectsListStateResult {
  const [state, setState] = useState<ProjectsListState>(INITIAL_STATE);

  return {
    ...state,
    setSearch: (search) =>
      setState((current) =>
        current.search === search ? current : { ...current, search, page: 1 },
      ),
    setSort: (sort) => setState((current) => ({ ...current, sort, page: 1 })),
    setPage: (page) => setState((current) => ({ ...current, page })),
  };
}
