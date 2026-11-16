import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { GqlExecutionContext } from "@nestjs/graphql";
import { IS_PUBLIC_KEY } from "../../../common/auth";
import type { AuthUser } from "../../../common/auth";
import type { AuthContext } from "../auth-context";
import { AuthService } from "../auth.service";
import { SessionCookiesService } from "./session-cookies.service";
import { TokenService } from "./token.service";

/**
 * Global (D10). Reads the access token cookie and puts the user on `request.user`.
 * Without a valid session only `@Public()` resolvers are allowed; the rest answer UNAUTHENTICATED.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly cookies: SessionCookiesService,
    private readonly tokens: TokenService,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { req } = GqlExecutionContext.create(context).getContext<AuthContext>();

    // Also tried on @Public() resolvers, so that `me` can see who is signed in.
    const user = await this.findUser(req);
    if (user !== undefined) {
      req.user = user;
      return true;
    }

    const isPublic = this.reflector.getAllAndOverride<boolean | undefined>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic === true) return true;
    throw new UnauthorizedException("Sign in to continue");
  }

  private async findUser(req: AuthContext["req"]): Promise<AuthUser | undefined> {
    const token = this.cookies.readAccessToken(req);
    if (token === undefined) return undefined;

    const claims = await this.tokens.verifyAccessToken(token);
    return claims === undefined
      ? undefined
      : this.authService.findAuthUser(claims.userId, claims.tokenVersion);
  }
}
