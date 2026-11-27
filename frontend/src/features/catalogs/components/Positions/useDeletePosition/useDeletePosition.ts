"use client";

import { useMutation } from "@apollo/client/react";
import { DeletePositionDocument, PositionsDocument } from "@/shared/graphql";

export type UseDeletePositionResult = {
  /** Sends `deletePosition`. Rejects with the request's error (`CONFLICT` = the position is in use). */
  remove: (id: string) => Promise<void>;
};

/**
 * The `deletePosition` request. On success the position leaves the cache (its row disappears at once) and the
 * open list loads again with the same search, sort and page, for the new total.
 */
export function useDeletePosition(): UseDeletePositionResult {
  const [deletePosition] = useMutation(DeletePositionDocument);

  async function remove(id: string): Promise<void> {
    await deletePosition({
      variables: { id },
      update: (cache) => {
        const cacheId = cache.identify({ __typename: "Position", id });
        if (cacheId === undefined) return;
        cache.evict({ id: cacheId });
        cache.gc();
      },
      refetchQueries: [PositionsDocument],
    });
  }

  return { remove };
}
