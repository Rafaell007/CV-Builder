import { Field, ID, InputType } from "@nestjs/graphql";
import { IsUUID } from "class-validator";
import { CreateProjectInput } from "./create-project.input";

/** Replaces all fields of a project, including its environment. */
@InputType()
export class UpdateProjectInput extends CreateProjectInput {
  @Field(() => ID)
  @IsUUID()
  id!: string;
}
