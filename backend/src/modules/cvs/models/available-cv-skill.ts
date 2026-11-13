import { Field, ID, ObjectType } from "@nestjs/graphql";
import { Mastery } from "../../skills/models/mastery.enum";
import { SkillCategory } from "../../skills/models/skill-category";

/**
 * A skill that the owner of a CV has and that is not yet in the CV. The Add skill modal lists these.
 * `mastery` is the owner's own level; `addCvSkill` uses it when the request names no level.
 */
@ObjectType()
export class AvailableCvSkill {
  /** The id of the catalog skill. */
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field(() => SkillCategory)
  category!: SkillCategory;

  @Field(() => Mastery)
  mastery!: Mastery;
}
