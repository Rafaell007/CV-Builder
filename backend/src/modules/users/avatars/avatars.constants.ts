/** The largest avatar file the upload accepts: 5 MB (D11, user profile page AC-20). */
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

/** The multipart field that holds the image in `POST /api/users/:id/avatar`. */
export const AVATAR_FILE_FIELD = "file";

/**
 * The rate limit of `GET /api/users/:id/avatar`: at most 300 reads per client IP in 60 seconds. It is higher than
 * the shared limit of D23, because one page can show many photos (the users table has one per row).
 */
export const AVATAR_READ_LIMIT = 300;
export const AVATAR_READ_TTL_MS = 60 * 1000; // the throttler counts in ms

/** `reason` in the body of the 415 answer when the file is not a PNG, JPG or GIF image. */
export const UNSUPPORTED_FILE_TYPE_REASON = "UNSUPPORTED_FILE_TYPE";
