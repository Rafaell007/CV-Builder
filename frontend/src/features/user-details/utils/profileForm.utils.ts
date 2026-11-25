import type { CatalogOption, UseCatalogOptionsResult } from "@/shared/catalogOptions";
import type { Failure } from "@/shared/failures";
import type { UpdateProfileInput } from "@/shared/graphql";
import { CONCURRENT_CHANGE_REASON } from "@/shared/userProfile";
import type { ProfileFormValues, ProfileGeneralError, ProfileUser } from "../user-details.types";

/** The `updateProfile` input: the checked form values (names already trimmed by the rules) of this user. */
export function toUpdateProfileInput(
  userId: string,
  values: ProfileFormValues,
): UpdateProfileInput {
  return { id: userId, ...values };
}

/**
 * True when the typed values differ from the saved ones. Names are compared trimmed, like the rules send them, so
 * "Emma " for "Emma" is not a change (UPDATE stays disabled).
 */
export function hasProfileChanged(typed: ProfileFormValues, saved: ProfileFormValues): boolean {
  return (
    typed.firstName.trim() !== saved.firstName.trim() ||
    typed.lastName.trim() !== saved.lastName.trim() ||
    typed.departmentId !== saved.departmentId ||
    typed.positionId !== saved.positionId
  );
}

/**
 * The general message of a failed save. The caller shows field errors (`invalid`) under their fields first and uses
 * this only for what is left; so `invalid` here means a field error the form cannot show, which is `failed`.
 */
export function toProfileGeneralError({ kind, reason }: Failure): ProfileGeneralError {
  if (kind === "forbidden") return "forbidden";
  if (kind === "notFound") return "notFound";
  if (kind === "conflict" && reason === CONCURRENT_CHANGE_REASON) return "concurrentChange";
  return "failed";
}

/** The start values of the Profile form: the user's names, department and position (`""` when not set). */
export function toProfileFormValues(user: Omit<ProfileUser, "id">): ProfileFormValues {
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
