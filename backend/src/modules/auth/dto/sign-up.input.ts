import { Field, InputType } from "@nestjs/graphql";
import { Transform } from "class-transformer";
import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

/** Checked again on the server, because the checks in the browser are not a security measure (sign-up page AC-14). */
@InputType()
export class SignUpInput {
  @Field()
  @Transform(({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value))
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @Field()
  @IsString()
  @MinLength(6)
  @MaxLength(128) // argon2 hashing is slow on purpose; a huge password would be a cheap way to overload the server
  password!: string;
}
