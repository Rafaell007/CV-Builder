"use client";

import { useMutation } from "@apollo/client/react";
import { CreateDepartmentDocument, DepartmentsDocument } from "@/shared/graphql";
import type { DepartmentListItem } from "../departments.types";

export type UseCreateDepartmentResult = {
  /** Sends `createDepartment`. Resolves with the new department. Rejects with the request's error (`CONFLICT` = the name is taken). */
  create: (name: string) => Promise<DepartmentListItem>;
};

/**
 * The `createDepartment` request. On success the open `Departments` list loads again: the new department belongs in
 * the sorted, searched and cut list at a place only the backend knows, and the total changes.
 */
export function useCreateDepartment(): UseCreateDepartmentResult {
  const [createDepartment] = useMutation(CreateDepartmentDocument);

  async function create(name: string): Promise<DepartmentListItem> {
    const { data } = await createDepartment({
      variables: { input: { name } },
      refetchQueries: [DepartmentsDocument],
    });
    // `useMutation` rejects on an error, so a missing result is not expected; fail loudly if it ever happens.
    if (!data) throw new Error("createDepartment returned no department");
    return data.createDepartment;
  }

  return { create };
}
