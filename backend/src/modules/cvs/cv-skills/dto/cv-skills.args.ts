import { ArgsType, Field, ID } from "@nestjs/graphql";
import { IsUUID } from "class-validator";

/** `cvSkills(cvId: "...")` and `availableCvSkills(cvId: "...")`. A CV holds few skills, so there is no paging. */
@ArgsType()
export class CvSkillsArgs {
  @Field(() => ID)
  @IsUUID()
  cvId!: string;
}
