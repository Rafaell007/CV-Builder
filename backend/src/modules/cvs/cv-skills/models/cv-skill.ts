import { Field, ID, ObjectType } from "@nestjs/graphql";
import { Mastery } from "../../skills/models/mastery.enum";
import { SkillCategory } from "../../skills/models/skill-category";

/**
 * A skill in one CV (CV skills page). `id` is the id of the CV-skill link, `skillId` is the id of
 * the catalog skill. The mastery belongs to this CV and can differ from the one of the owner.
 */
@ObjectType()
export class CvSkill {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  cvId!: string;

  @Field(() => ID)
  skillId!: string;

  @Field()
  name!: string;

  @Field(() => SkillCategory)
  category!: SkillCategory;

  @Field(() => Mastery)
  mastery!: Mastery;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
