import { Field, ID, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class Department {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;
}
