import { Field, ID, InputType } from "@nestjs/graphql";
import { IsUUID } from "class-validator";
import { CreateDepartmentInput } from "./create-department.input";

@InputType()
export class UpdateDepartmentInput extends CreateDepartmentInput {
  @Field(() => ID)
  @IsUUID()
  id!: string;
}
