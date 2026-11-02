import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Role } from "../../generated/prisma/enums";
import { ROLES_KEY } from "./decorators";
import { getRequestUser } from "./request-user";

/** Enforces `@Roles(...)`. Resolvers without it are open to every signed-in user. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (roles === undefined || roles.length === 0) return true;

    const user = getRequestUser(context);
    if (user === undefined) throw new UnauthorizedException("Sign in to continue");
    if (!roles.includes(user.role)) {
      throw new ForbiddenException("You are not allowed to do this");
    }
    return true;
  }
}
