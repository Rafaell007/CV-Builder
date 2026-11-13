"use client";

import { useState } from "react";
import type { SortState } from "@/shared/components";
import { DEFAULT_CV_PROJECTS_SORT } from "../cvProjects.constants";
import type { CvProjectsListState } from "../cvProjects.types";

export type UseCvProjectsListStateResult = CvProjectsListState & {
  /** The same search again (also with other spaces around it) changes nothing. */
  setSearch: (search: string) => void;
  setSort: (sort: SortState) => void;
};

const INITIAL_STATE: CvProjectsListState = { search: "", sort: DEFAULT_CV_PROJECTS_SORT };

/** Holds what the user chose for the CV projects list: search and sort. Nothing is filtered or sorted here. */
export function useCvProjectsListState(): UseCvProjectsListStateResult {
  const [state, setState] = useState<CvProjectsListState>(INITIAL_STATE);

  return {
    ...state,
    setSearch: (search) =>
      // The query sends the trimmed text, so a change of spaces only is not a new search.
      setState((current) =>
        current.search.trim() === search.trim() ? current : { ...current, search },
      ),
    setSort: (sort) => setState((current) => ({ ...current, sort })),
  };
}
