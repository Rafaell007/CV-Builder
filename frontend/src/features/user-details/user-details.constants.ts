/** The tabs of the User Details page, in the order the page shows them. Each one is a route: `/users/{id}/{tab}`. */
export const USER_TABS = ["profile", "skills", "languages", "cvs"] as const;

/** Tabs that only an Admin sees. The backend still rejects the requests of other roles. */
export const ADMIN_ONLY_USER_TABS: ReadonlyArray<(typeof USER_TABS)[number]> = ["cvs"];
