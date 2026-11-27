/** First and last name: at most 100 characters, like the backend `UpdateUserInput` and `UpdateProfileInput`. */
export const USER_NAME_MAX_LENGTH = 100;

/**
 * `extensions.reason` of the backend CONFLICT when another request changed the same user at the same time (users
 * module: update, delete, update profile). Nothing was saved, so the user can try again.
 */
export const CONCURRENT_CHANGE_REASON = "CONCURRENT_CHANGE";
