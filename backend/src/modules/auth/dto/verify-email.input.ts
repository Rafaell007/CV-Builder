import { Field, InputType } from "@nestjs/graphql";
import { Transform } from "class-transformer";
import { Matches } from "class-validator";

/** Checked again on the server, because the checks in the browser are not a security measure (verification page AC-6). */
@InputType()
export class VerifyEmailInput {
  @Field()
  @Transform(({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value))
  @Matches(/^\d{6}$/, { message: "Please enter a valid 6-digit code" })
  code!: string;
}
