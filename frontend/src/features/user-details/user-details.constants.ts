/** The tabs of the User Details page, in the order the page shows them. Each one is a route: `/users/{id}/{tab}`. */
export const USER_TABS = ["profile", "skills", "languages", "cvs"] as const;

/** The largest avatar file: 5 MB, the same limit as the backend (PLAN D11, AC-20). */
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

/**
 * The image types an avatar may have (PNG, JPG/JPEG, GIF; PLAN D11). Also the file picker's `accept` list. The browser
 * reads the type from the file name; the backend checks the real file content.
 */
export const AVATAR_MIME_TYPES = ["image/png", "image/jpeg", "image/gif"] as const;
