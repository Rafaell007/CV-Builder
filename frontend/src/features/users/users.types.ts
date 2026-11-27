import type { Role, UsersQuery } from "@/shared/graphql";

/** One row of the users list, as the `Users` query returns it. Names, department and position can be empty for a user who signed up. */
export type UserListItem = UsersQuery["users"]["items"][number];

/**
 * What the Create user and Update user fields hold. A select holds "" while nothing is chosen. In Update, Email holds
 * the user's email (shown, not sent) and Password stays "" (a password is never loaded).
 */
export type UserFormValues = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  departmentId: string;
  positionId: string;
  role: Role | "";
};

/** What the Create user and Update user rules make of the fields: trimmed texts and a chosen role. */
export type UserFormSubmit = Omit<UserFormValues, "role"> & { role: Role };
