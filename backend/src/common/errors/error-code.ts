/** The values of `extensions.code` on every GraphQL error (D7). The frontend switches on these. */
export const ErrorCode = {
  Unauthenticated: "UNAUTHENTICATED",
  Forbidden: "FORBIDDEN",
  BadUserInput: "BAD_USER_INPUT",
  NotFound: "NOT_FOUND",
  Conflict: "CONFLICT",
  TooManyRequests: "TOO_MANY_REQUESTS",
  InternalServerError: "INTERNAL_SERVER_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
