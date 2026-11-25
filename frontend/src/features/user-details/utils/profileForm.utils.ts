import type { CatalogOption, UseCatalogOptionsResult } from "@/shared/catalogOptions";
import type { ProfileFormValues, ProfileUser } from "../user-details.types";

/** The start values of the Profile form: the user's names, department and position (`""` when not set). */
export function toProfileFormValues(user: ProfileUser): ProfileFormValues {
  return {
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    departmentId: user.department?.id ?? "",
    positionId: user.position?.id ?? "",
  };
}

/**
 * The options a Department or Position select of the Profile form gets. Read-only: only the user's current item (no
 * loading, no error: there is nothing to choose). Editable: the loaded list, plus the current item when the list does
 * not have it (the load failed), so the select still shows the user's value next to the error and Retry.
 */
export function toProfileCatalog(
  catalog: UseCatalogOptionsResult,
  current: CatalogOption | null,
  readOnly: boolean,
): UseCatalogOptionsResult {
  if (readOnly) {
    return {
      options: current ? [current] : [],
      loading: false,
      failed: false,
      retry: catalog.retry,
    };
  }
  const options = catalog.options ?? [];
  if (!current || options.some((option) => option.id === current.id)) return catalog;
  return { ...catalog, options: [current, ...options] };
}
