"use client";

import { PositionsDocument, type PositionsQueryVariables } from "@/shared/graphql";
import { usePagedList, type UsePagedListResult } from "@/shared/lists";
import type { PositionListItem } from "../positions.types";

export type UsePositionsResult = UsePagedListResult<PositionListItem>;

/** Loads one page of positions with the `Positions` query (the shared `usePagedList`). The backend searches, sorts and cuts the page. */
export function usePositions(variables: PositionsQueryVariables): UsePositionsResult {
  return usePagedList(PositionsDocument, variables, (data) => data.positions);
}
