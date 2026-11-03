import { Field, InputType } from "@nestjs/graphql";
import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";
import { Trim } from "../../../common/validation";

/** Checked again on the server, because the checks in the browser are not a security measure (sign-in page AC-20). */
@InputType()
export class SignInInput {
  @Field()
  @Trim()
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @Field()
  @IsString()
  @MinLength(6)
  @MaxLength(128) // argon2 hashing is slow on purpose; a huge password would be a cheap way to overload the server
  password!: string;
}
