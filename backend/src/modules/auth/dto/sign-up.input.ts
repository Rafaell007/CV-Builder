import { Field, InputType } from "@nestjs/graphql";
import { IsEmail, IsString, Matches, MaxLength, MinLength } from "class-validator";
import { Trim } from "../../../common/validation";

/** At least one letter and one digit (D33). Sign-in does not use it, so older, weaker passwords still work. */
const LETTER_AND_DIGIT = /^(?=.*\p{L})(?=.*\d)/u;

/** Checked again on the server, because the checks in the browser are not a security measure (sign-up page AC-14). */
@InputType()
export class SignUpInput {
  @Field()
  @Trim()
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @Field()
  @IsString()
  @MinLength(8)
  @MaxLength(128) // argon2 hashing is slow on purpose; a huge password would be a cheap way to overload the server
  @Matches(LETTER_AND_DIGIT, { message: "password must contain a letter and a digit" })
  password!: string;
}
