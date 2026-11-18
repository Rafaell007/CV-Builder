import { Field, InputType } from "@nestjs/graphql";
import { IsString, Length } from "class-validator";
import { PasswordRule } from "./password-rule";

@InputType()
export class ChangePasswordInput {
  /** No D33 rule here: an older password may be weaker. Whether it is correct is decided by the service. */
  @Field()
  @IsString()
  @Length(1, 128)
  currentPassword!: string;

  @Field()
  @PasswordRule()
  newPassword!: string;
}
