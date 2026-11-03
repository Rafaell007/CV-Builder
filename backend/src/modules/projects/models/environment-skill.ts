import { Field, ID, ObjectType } from "@nestjs/graphql";

/** One technology tag of a project's environment. It is a skill of the skills catalog (PLAN.md §7, ProjectSkill). */
@ObjectType()
export class EnvironmentSkill {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;
}
