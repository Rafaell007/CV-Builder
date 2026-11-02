import {
  createParamDecorator,
  CustomDecorator,
  ExecutionContext,
  SetMetadata,
} from "@nestjs/common";
import type { Role } from "../../generated/prisma/enums";
import type { AuthUser } from "./auth-user";
import { getRequestUser } from "./request-user";

export const IS_PUBLIC_KEY = "auth:isPublic";
export const ROLES_KEY = "auth:roles";
export const VERIFIED_KEY = "auth:verified";

/** Opts a resolver (or a whole resolver class) out of the global sign-in requirement (D10). */
export const Public = (): CustomDecorator => SetMetadata(IS_PUBLIC_KEY, true);

/** Only the listed roles may call the resolver; everyone else gets FORBIDDEN. */
export const Roles = (...roles: Role[]): CustomDecorator => SetMetadata(ROLES_KEY, roles);

/** Only users with a verified email may call the resolver (D16); others get FORBIDDEN / EMAIL_NOT_VERIFIED. */
export const Verified = (): CustomDecorator => SetMetadata(VERIFIED_KEY, true);

/** The signed-in user. `undefined` on `@Public()` resolvers when nobody is signed in. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser | undefined => getRequestUser(context),
);
