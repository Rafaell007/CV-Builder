import { Field, ID, InputType } from "@nestjs/graphql";
import { IsIn, IsUUID } from "class-validator";
import { Mastery } from "../../../skills/models/mastery.enum";
import { MASTERY_NOT_SUPPORTED_MESSAGE, USER_SKILL_MASTERY_LEVELS } from "../user-skills.constants";

@InputType()
export class AddUserSkillInput {
  @Field(() => ID)
  @IsUUID()
  userId!: string;

  /** The id of a catalog skill. */
  @Field(() => ID)
  @IsUUID("all", { message: "Skill is required" })
  skillId!: string;

  @Field(() => Mastery)
  @IsIn(USER_SKILL_MASTERY_LEVELS, { message: MASTERY_NOT_SUPPORTED_MESSAGE })
  mastery!: Mastery;
}
