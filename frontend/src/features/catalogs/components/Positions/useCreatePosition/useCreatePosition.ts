"use client";

import { useMutation } from "@apollo/client/react";
import { CreatePositionDocument, PositionsDocument } from "@/shared/graphql";
import type { PositionListItem } from "../positions.types";

export type UseCreatePositionResult = {
  /** Sends `createPosition`. Resolves with the new position. Rejects with the request's error (`CONFLICT` = the name is taken). */
  create: (name: string) => Promise<PositionListItem>;
};

/**
 * The `createPosition` request. On success the open `Positions` list loads again: the new position belongs in
 * the sorted, searched and cut list at a place only the backend knows, and the total changes.
 */
export function useCreatePosition(): UseCreatePositionResult {
  const [createPosition] = useMutation(CreatePositionDocument);

  async function create(name: string): Promise<PositionListItem> {
    const { data } = await createPosition({
      variables: { input: { name } },
      refetchQueries: [PositionsDocument],
    });
    // `useMutation` rejects on an error, so a missing result is not expected; fail loudly if it ever happens.
    if (!data) throw new Error("createPosition returned no position");
    return data.createPosition;
  }

  return { create };
}
