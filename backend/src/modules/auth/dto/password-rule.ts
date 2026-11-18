import { applyDecorators } from "@nestjs/common";
import { IsString, Matches, MaxLength, MinLength } from "class-validator";

/** At least one letter and one digit (D33). Sign-in does not use it, so older, weaker passwords still work. */
const LETTER_AND_DIGIT = /^(?=.*\p{L})(?=.*\d)/u;

/** The D33 rule for a new password, shared by sign-up, reset and change password. */
export function PasswordRule() {
  return applyDecorators(
    IsString(),
    MinLength(8),
    MaxLength(128), // argon2 hashing is slow on purpose; a huge password would be a cheap way to overload the server
    Matches(LETTER_AND_DIGIT, { message: "$property must contain a letter and a digit" }),
  );
}
