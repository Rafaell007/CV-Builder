import type { USER_TABS } from "./user-details.constants";

export type UserTab = (typeof USER_TABS)[number];

/** What the shell shows in place of the tab page: the page itself, or one of the failures of loading the user. */
export type UserLayoutView = "ready" | "notFound" | "failed";
