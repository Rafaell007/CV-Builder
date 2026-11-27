"use client";

import { useMutation } from "@apollo/client/react";
import { DepartmentsDocument, UpdateDepartmentDocument } from "@/shared/graphql";
import type { DepartmentListItem } from "../departments.types";

export type UseUpdateDepartmentResult = {
  /** Sends `updateDepartment`. Resolves with the saved department. Rejects with the request's error (`CONFLICT` = the name is taken). */
  update: (id: string, name: string) => Promise<DepartmentListItem>;
};

/**
 * The `updateDepartment` request. On success the open `Departments` list loads again: a new name can move the
 * department in the sorted, searched and cut list, and only the backend knows where.
 */
export function useUpdateDepartment(): UseUpdateDepartmentResult {
  const [updateDepartment] = useMutation(UpdateDepartmentDocument);

  async function update(id: string, name: string): Promise<DepartmentListItem> {
    const { data } = await updateDepartment({
      variables: { input: { id, name } },
      refetchQueries: [DepartmentsDocument],
    });
    // `useMutation` rejects on an error, so a missing result is not expected; fail loudly if it ever happens.
    if (!data) throw new Error("updateDepartment returned no department");
    return data.updateDepartment;
  }

  return { update };
}
