import { Field, ID, ObjectType } from "@nestjs/graphql";
import { SkillCategory } from "./skill-category";

/** A skill of the global catalog. Its type comes from its category (page 17), so it has no own type field. */
@ObjectType()
export class Skill {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field(() => SkillCategory)
  category!: SkillCategory;
}
