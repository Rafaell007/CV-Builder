import { UnauthorizedException, UseGuards } from "@nestjs/common";
import { Args, Mutation, Resolver } from "@nestjs/graphql";
import { CurrentUser } from "../../common/auth";
import type { AuthUser } from "../../common/auth";
import { GqlThrottlerGuard } from "../../common/throttling";
import { VerifyEmailInput } from "./dto/verify-email.input";
import { SessionUser } from "./models/session-user";
import { VerificationService } from "./verification.service";

/** Both mutations need a session: they act on the signed-in user, who may not be verified yet (D16). */
@Resolver()
export class VerificationResolver {
  constructor(private readonly verification: VerificationService) {}

  @UseGuards(GqlThrottlerGuard)
  @Mutation(() => SessionUser)
  verifyEmail(
    @CurrentUser() user: AuthUser | undefined,
    @Args("input") { code }: VerifyEmailInput,
  ): Promise<SessionUser> {
    return this.verification.verifyEmail(requireUser(user).id, code);
  }

  @UseGuards(GqlThrottlerGuard)
  @Mutation(() => Boolean)
  async resendVerificationCode(@CurrentUser() user: AuthUser | undefined): Promise<boolean> {
    await this.verification.resendCode(requireUser(user).id);
    return true;
  }
}

// The global guard has already refused anonymous calls; this keeps the type honest.
function requireUser(user: AuthUser | undefined): AuthUser {
  if (user === undefined) throw new UnauthorizedException("Sign in to continue");
  return user;
}
