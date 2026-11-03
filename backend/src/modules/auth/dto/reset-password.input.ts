import { Field, InputType } from "@nestjs/graphql";
import { IsString, Length, Matches, MaxLength, MinLength } from "class-validator";

/** At least one letter and one digit (D33). The same rule as sign-up; sign-in does not use it, so older, weaker passwords still work. */
const LETTER_AND_DIGIT = /^(?=.*\p{L})(?=.*\d)/u;

/** Checked again on the server, because the checks in the browser are not a security measure (reset password page AC-12). */
@InputType()
export class ResetPasswordInput {
  /** The token from the link in the mail. Whether it is correct is decided by the service, not here. */
  @Field()
  @IsString()
  @Length(1, 200)
  token!: string;

  @Field()
  @IsString()
  @MinLength(8)
  @MaxLength(128) // argon2 hashing is slow on purpose; a huge password would be a cheap way to overload the server
  @Matches(LETTER_AND_DIGIT, { message: "newPassword must contain a letter and a digit" })
  newPassword!: string;
}
