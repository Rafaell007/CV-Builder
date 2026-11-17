import { Field, InputType } from "@nestjs/graphql";
import { IsString, Length } from "class-validator";
import { PasswordRule } from "../../dto/password-rule";

/** Checked again on the server, because the checks in the browser are not a security measure (reset password page AC-12). */
@InputType()
export class ResetPasswordInput {
  /** The token from the link in the mail. Whether it is correct is decided by the service, not here. */
  @Field()
  @IsString()
  @Length(1, 200)
  token!: string;

  @Field()
  @PasswordRule()
  newPassword!: string;
}
