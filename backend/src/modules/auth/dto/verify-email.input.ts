import { Field, InputType } from "@nestjs/graphql";
import { Matches } from "class-validator";
import { Trim } from "../../../common/validation";

/** Checked again on the server, because the checks in the browser are not a security measure (verification page AC-6). */
@InputType()
export class VerifyEmailInput {
  @Field()
  @Trim()
  @Matches(/^\d{6}$/, { message: "Please enter a valid 6-digit code" })
  code!: string;
}
