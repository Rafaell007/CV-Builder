import { Field, ID, InputType } from "@nestjs/graphql";
import { IsUUID } from "class-validator";
import { CreateSkillInput } from "./create-skill.input";

@InputType()
export class UpdateSkillInput extends CreateSkillInput {
  @Field(() => ID)
  @IsUUID()
  id!: string;
}
