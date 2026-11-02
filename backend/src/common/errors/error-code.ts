/** The values of `extensions.code` on every GraphQL error (D7). The frontend switches on these. */
export const ErrorCode = {
  Unauthenticated: "UNAUTHENTICATED",
  Forbidden: "FORBIDDEN",
  BadUserInput: "BAD_USER_INPUT",
  NotFound: "NOT_FOUND",
  Conflict: "CONFLICT",
  InternalServerError: "INTERNAL_SERVER_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
