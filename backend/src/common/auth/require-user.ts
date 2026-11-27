import { UnauthorizedException } from "@nestjs/common";
import type { AuthUser } from "./auth-user";

/** The global guard has already refused anonymous calls; this keeps the type honest. */
export function requireUser(user: AuthUser | undefined): AuthUser {
  if (user === undefined) throw new UnauthorizedException("Sign in to continue");
  return user;
}
