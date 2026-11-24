"use client";

import { PositionsDocument, type PositionsQuery } from "@/shared/graphql";
import { useCatalogOptions, type UseCatalogOptionsResult } from "../useCatalogOptions";

const selectPositions = (data: PositionsQuery) => data.positions;

/**
 * The options of the Position field (Create and Update user modals): every position, by name. It uses the
 * admin-only `positions` query of the catalog page; only an admin opens these modals.
 */
export function usePositionOptions(enabled: boolean): UseCatalogOptionsResult {
  return useCatalogOptions(PositionsDocument, selectPositions, enabled);
}
