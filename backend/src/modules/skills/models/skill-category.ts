import { Field, ID, ObjectType } from "@nestjs/graphql";

/** The category of a skill, for example Frontend. The skills pages group skills by it. */
@ObjectType()
export class SkillCategory {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  /** For example Programming technologies. It is the type of every skill in this category (page 17). */
  @Field()
  type!: string;
}
