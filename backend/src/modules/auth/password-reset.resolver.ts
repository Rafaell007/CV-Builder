import { UseGuards } from "@nestjs/common";
import { Args, Mutation, Resolver } from "@nestjs/graphql";
import { Public } from "../../common/auth";
import { GqlThrottlerGuard } from "../../common/throttling";
import { ForgotPasswordInput } from "./dto/forgot-password.input";
import { ResetPasswordInput } from "./dto/reset-password.input";
import { PasswordResetService } from "./password-reset.service";

/** Both mutations are public: the user who forgot the password cannot sign in. */
@Resolver()
export class PasswordResetResolver {
  constructor(private readonly passwordReset: PasswordResetService) {}

  /** Always `true`, also for an unknown email, so the answer does not show who is registered. */
  @Public()
  @UseGuards(GqlThrottlerGuard)
  @Mutation(() => Boolean)
  async forgotPassword(@Args("input") { email }: ForgotPasswordInput): Promise<boolean> {
    await this.passwordReset.requestReset(email);
    return true;
  }

  @Public()
  @UseGuards(GqlThrottlerGuard)
  @Mutation(() => Boolean)
  async resetPassword(@Args("input") { token, newPassword }: ResetPasswordInput): Promise<boolean> {
    await this.passwordReset.resetPassword(token, newPassword);
    return true;
  }
}
