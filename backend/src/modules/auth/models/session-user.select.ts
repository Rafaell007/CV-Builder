/** The Prisma `select` that gives exactly the fields of `SessionUser`, and never the password hash. */
export const SESSION_USER_SELECT = {
  id: true,
  email: true,
  role: true,
  isVerified: true,
  firstName: true,
  lastName: true,
} as const;
