import { Field, ID, ObjectType } from "@nestjs/graphql";
import { Mastery } from "../../../skills/models/mastery.enum";
import { SkillCategory } from "../../../skills/models/skill-category";

/**
 * A skill of one user (user skills page). `id` is the id of the user-skill link, `skillId` is the id
 * of the catalog skill. The list is flat and sorted by category; the page groups it.
 */
@ObjectType()
export class UserSkill {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  userId!: string;

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
