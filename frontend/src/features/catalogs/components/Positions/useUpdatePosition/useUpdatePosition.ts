"use client";

import { useMutation } from "@apollo/client/react";
import { PositionsDocument, UpdatePositionDocument } from "@/shared/graphql";
import type { PositionListItem } from "../positions.types";

export type UseUpdatePositionResult = {
  /** Sends `updatePosition`. Resolves with the saved position. Rejects with the request's error (`CONFLICT` = the name is taken). */
  update: (id: string, name: string) => Promise<PositionListItem>;
};

/**
 * The `updatePosition` request. On success the open `Positions` list loads again: a new name can move the
 * position in the sorted, searched and cut list, and only the backend knows where.
 */
export function useUpdatePosition(): UseUpdatePositionResult {
  const [updatePosition] = useMutation(UpdatePositionDocument);

  async function update(id: string, name: string): Promise<PositionListItem> {
    const { data } = await updatePosition({
      variables: { input: { id, name } },
      refetchQueries: [PositionsDocument],
    });
    // `useMutation` rejects on an error, so a missing result is not expected; fail loudly if it ever happens.
    if (!data) throw new Error("updatePosition returned no position");
    return data.updatePosition;
  }

  return { update };
}
