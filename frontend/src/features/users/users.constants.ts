import type { SortState } from "@/shared/components";
import type { Role } from "@/shared/graphql";

/** Backend sort fields of the users query. They are the `sortField` of the sortable columns; the backend refuses any other. */
export const USER_SORT_FIELDS = {
  firstName: "firstName",
  lastName: "lastName",
  department: "department",
  position: "position",
} as const;

/** The backend accepts a search of 100 characters at most. */
export const SEARCH_MAX_LENGTH = 100;

/** The order of the list when the page opens, and the order the backend uses without a sort. The First Name header shows it. */
export const DEFAULT_USERS_SORT: SortState = {
  field: USER_SORT_FIELDS.firstName,
  direction: "ASC",
};

/** First and last name: at most 100 characters, like the backend `CreateUserInput`. */
export const MAX_NAME_LENGTH = 100;

/** The role a new user gets unless the admin picks another one (Figma: Role prefilled "Employee"). */
export const DEFAULT_USER_ROLE = "USER" satisfies Role;

/** `extensions.reason` of the backend CONFLICT for a taken email (backend users README). */
export const EMAIL_TAKEN_REASON = "EMAIL_TAKEN";

/** `extensions.reason` of the backend CONFLICT when an admin removes their own Admin role (D24). */
export const OWN_ROLE_REASON = "OWN_ROLE";

/** `extensions.reason` of the backend CONFLICT when an admin deletes their own account (D24). */
export const SELF_DELETE_REASON = "SELF_DELETE";

/**
 * `extensions.reason` of the backend CONFLICT when another request changed the same user at the same time. Nothing was
 * saved, so the admin can try again.
 */
export const CONCURRENT_CHANGE_REASON = "CONCURRENT_CHANGE";
