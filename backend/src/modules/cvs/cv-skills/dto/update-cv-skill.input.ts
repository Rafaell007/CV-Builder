import { Field, ID, InputType } from "@nestjs/graphql";
import { IsEnum, IsUUID } from "class-validator";
import { Mastery } from "../../../skills/models/mastery.enum";

/** The skill of a CV-skill link cannot change (page doc: the Skill field is disabled). Only the mastery can. */
@InputType()
export class UpdateCvSkillInput {
  /** The id of the CV-skill link, not of the catalog skill. */
  @Field(() => ID)
  @IsUUID()
  id!: string;

  @Field(() => Mastery)
  @IsEnum(Mastery)
  mastery!: Mastery;
}
