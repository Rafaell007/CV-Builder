"use client";

import { useMutation } from "@apollo/client/react";
import { DeleteDepartmentDocument, DepartmentsDocument } from "@/shared/graphql";

export type UseDeleteDepartmentResult = {
  /** Sends `deleteDepartment`. Rejects with the request's error (`CONFLICT` = the department is in use). */
  remove: (id: string) => Promise<void>;
};

/**
 * The `deleteDepartment` request. On success the department leaves the cache (its row disappears at once) and the
 * open list loads again with the same search, sort and page, for the new total.
 */
export function useDeleteDepartment(): UseDeleteDepartmentResult {
  const [deleteDepartment] = useMutation(DeleteDepartmentDocument);

  async function remove(id: string): Promise<void> {
    await deleteDepartment({
      variables: { id },
      update: (cache) => {
        const cacheId = cache.identify({ __typename: "Department", id });
        if (cacheId === undefined) return;
        cache.evict({ id: cacheId });
        cache.gc();
      },
      refetchQueries: [DepartmentsDocument],
    });
  }

  return { remove };
}
