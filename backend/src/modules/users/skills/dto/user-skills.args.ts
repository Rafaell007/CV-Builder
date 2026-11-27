import { ArgsType, Field, ID } from "@nestjs/graphql";
import { IsUUID } from "class-validator";

/** `userSkills(userId: "...")`. A user has few skills, so there is no paging. */
@ArgsType()
export class UserSkillsArgs {
  @Field(() => ID)
  @IsUUID()
  userId!: string;
}
