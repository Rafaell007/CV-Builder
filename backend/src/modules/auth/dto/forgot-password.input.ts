import { Field, InputType } from "@nestjs/graphql";
import { Transform } from "class-transformer";
import { IsEmail, MaxLength } from "class-validator";

/** Checked again on the server, because the checks in the browser are not a security measure (forgot password page AC-8). */
@InputType()
export class ForgotPasswordInput {
  @Field()
  @Transform(({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value))
  @IsEmail()
  @MaxLength(255)
  email!: string;
}
