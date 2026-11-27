import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { VERIFIED_KEY } from "./decorators";
import { EmailNotVerifiedException } from "./email-not-verified.exception";
import { getRequestUser } from "./request-user";

/** Enforces `@Verified()`: the action needs a user with a verified email. */
@Injectable()
export class VerifiedGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const verifiedOnly = this.reflector.getAllAndOverride<boolean | undefined>(VERIFIED_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (verifiedOnly !== true) return true;

    const user = getRequestUser(context);
    if (user === undefined) throw new UnauthorizedException("Sign in to continue");
    if (!user.isVerified) throw new EmailNotVerifiedException();
    return true;
  }
}
