"use client";

import { DepartmentsDocument, type DepartmentsQuery } from "@/shared/graphql";
import { useCatalogOptions, type UseCatalogOptionsResult } from "../useCatalogOptions";

const selectDepartments = (data: DepartmentsQuery) => data.departments;

/**
 * The options of the Department field (Create and Update user modals): every department, by name. It uses the
 * admin-only `departments` query of the catalog page; only an admin opens these modals.
 */
export function useDepartmentOptions(enabled: boolean): UseCatalogOptionsResult {
  return useCatalogOptions(DepartmentsDocument, selectDepartments, enabled);
}
