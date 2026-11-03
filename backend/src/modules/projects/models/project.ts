import { Field, ID, ObjectType } from "@nestjs/graphql";
import { EnvironmentSkill } from "./environment-skill";

/** A project of the global catalog. Dates are calendar days (stored as `DATE`). */
@ObjectType()
export class Project {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  domain!: string;

  @Field()
  startDate!: Date;

  @Field()
  endDate!: Date;

  @Field()
  description!: string;

  @Field(() => [EnvironmentSkill])
  environment!: EnvironmentSkill[];

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
