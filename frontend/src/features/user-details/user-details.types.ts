import type { UserQuery } from "@/shared/graphql";
import type { USER_TABS } from "./user-details.constants";

export type UserTab = (typeof USER_TABS)[number];

/** What the shell shows in place of the tab page: the page itself, or one of the failures of loading the user. */
export type UserLayoutView = "ready" | "notFound" | "failed";

/** The values of the Profile tab form. A select holds `""` while nothing is chosen. */
export type ProfileFormValues = {
  firstName: string;
  lastName: string;
  departmentId: string;
  positionId: string;
};

/** The part of the `user(id)` result that the Profile tab form shows. */
export type ProfileUser = Pick<
  UserQuery["user"],
  "firstName" | "lastName" | "department" | "position"
>;
