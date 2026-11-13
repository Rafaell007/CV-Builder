import { Field, ID, ObjectType } from "@nestjs/graphql";

/** A role a person can have in a CV project, for example Developer. Seeded; read-only in the API. */
@ObjectType()
export class ProjectRole {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;
}
