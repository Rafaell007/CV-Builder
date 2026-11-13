import { Field, InputType } from "@nestjs/graphql";
import { IsEmail, MaxLength } from "class-validator";
import { Trim } from "../../../../common/validation";

/** Checked again on the server, because the checks in the browser are not a security measure (forgot password page AC-8). */
@InputType()
export class ForgotPasswordInput {
  @Field()
  @Trim()
  @IsEmail()
  @MaxLength(255)
  email!: string;
}
