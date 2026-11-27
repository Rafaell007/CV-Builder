import { Field, ID, InputType } from "@nestjs/graphql";
import { IsIn, IsUUID } from "class-validator";
import { Mastery } from "../../../skills/models/mastery.enum";
import { MASTERY_NOT_SUPPORTED_MESSAGE, USER_SKILL_MASTERY_LEVELS } from "../user-skills.constants";

/** The skill of a user-skill link cannot change (page doc: the Skill field is disabled). Only the mastery can. */
@InputType()
export class UpdateUserSkillInput {
  /** The id of the user-skill link, not of the catalog skill. */
  @Field(() => ID)
  @IsUUID()
  id!: string;

  @Field(() => Mastery)
  @IsIn(USER_SKILL_MASTERY_LEVELS, { message: MASTERY_NOT_SUPPORTED_MESSAGE })
  mastery!: Mastery;
}
