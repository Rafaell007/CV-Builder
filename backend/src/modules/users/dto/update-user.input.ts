import { Field, ID, InputType, OmitType } from "@nestjs/graphql";
import { IsUUID } from "class-validator";
import { CreateUserInput } from "./create-user.input";

/**
 * An admin updates a user (Update User modal): the same fields and checks as create, without email and password,
 * which the modal shows disabled (users page AC-25). A password change has its own flow.
 */
@InputType()
export class UpdateUserInput extends OmitType(CreateUserInput, ["email", "password"] as const) {
  @Field(() => ID)
  @IsUUID()
  id!: string;
}
