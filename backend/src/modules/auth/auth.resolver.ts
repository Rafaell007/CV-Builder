import { UnauthorizedException, UseGuards } from "@nestjs/common";
import { Args, Context, Mutation, Query, Resolver } from "@nestjs/graphql";
import { CurrentUser, Public, requireUser } from "../../common/auth";
import type { AuthUser } from "../../common/auth";
import { GqlThrottlerGuard } from "../../common/throttling";
import type { AuthContext } from "./auth-context";
import { AuthService } from "./auth.service";
import { ChangePasswordInput } from "./dto/change-password.input";
import { SignInInput } from "./dto/sign-in.input";
import { SignUpInput } from "./dto/sign-up.input";
import { SessionUser } from "./models/session-user";
import { SessionCookiesService } from "./sessions/session-cookies.service";

@Resolver(() => SessionUser)
export class AuthResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly cookies: SessionCookiesService,
  ) {}

  @Public()
  @UseGuards(GqlThrottlerGuard)
  @Mutation(() => SessionUser)
  async signIn(
    @Args("input") input: SignInInput,
    @Context() { res }: AuthContext,
  ): Promise<SessionUser> {
    const { user, accessToken, refreshToken } = await this.authService.signIn(input);
    this.cookies.set(res, { accessToken, refreshToken });
    return user;
  }

  // The new user is signed in at once, but is not verified yet (D16); the code goes to their mailbox.
  @Public()
  @UseGuards(GqlThrottlerGuard)
  @Mutation(() => SessionUser)
  async signUp(
    @Args("input") input: SignUpInput,
    @Context() { res }: AuthContext,
  ): Promise<SessionUser> {
    const { user, accessToken, refreshToken } = await this.authService.signUp(input);
    this.cookies.set(res, { accessToken, refreshToken });
    return user;
  }

  // Signed-in users only, verified or not (decision C). Other sessions end; this one gets new cookies.
  @UseGuards(GqlThrottlerGuard)
  @Mutation(() => Boolean)
  async changePassword(
    @CurrentUser() user: AuthUser | undefined,
    @Args("input") input: ChangePasswordInput,
    @Context() { res }: AuthContext,
  ): Promise<boolean> {
    const tokens = await this.authService.changePassword(requireUser(user).id, input);
    this.cookies.set(res, tokens);
    return true;
  }

  // Public, because a user whose access token has expired must still be able to sign out.
  @Public()
  @Mutation(() => Boolean)
  async signOut(@Context() { req, res }: AuthContext): Promise<boolean> {
    await this.authService.signOut(this.cookies.readRefreshToken(req));
    this.cookies.clear(res);
    return true;
  }

  // Public, because this is called when the access token has already expired.
  @Public()
  @Mutation(() => Boolean)
  async refresh(@Context() { req, res }: AuthContext): Promise<boolean> {
    try {
      const tokens = await this.authService.refresh(this.cookies.readRefreshToken(req));
      this.cookies.set(res, tokens);
      return true;
    } catch (error) {
      // The session is over, so the browser must not keep sending the dead cookies.
      if (error instanceof UnauthorizedException) this.cookies.clear(res);
      throw error;
    }
  }

  // Public, because "nobody is signed in" is a normal answer (`null`), not an error.
  @Public()
  @Query(() => SessionUser, { nullable: true })
  me(@CurrentUser() user: AuthUser | undefined): Promise<SessionUser | null> {
    return user === undefined ? Promise.resolve(null) : this.authService.findSessionUser(user.id);
  }
}
