import { Field, InputType } from "@nestjs/graphql";
import { IsEmail, MaxLength } from "class-validator";
import { Trim } from "../../../common/validation";
import { PasswordRule } from "./password-rule";

/** Checked again on the server, because the checks in the browser are not a security measure (sign-up page AC-14). */
@InputType()
export class SignUpInput {
  @Field()
  @Trim()
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @Field()
  @PasswordRule()
  password!: string;
}
