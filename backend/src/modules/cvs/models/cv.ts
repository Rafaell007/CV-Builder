import { Field, ID, ObjectType } from "@nestjs/graphql";

/** A CV as the CVs table and the details page need it (cvs page AC). */
@ObjectType()
export class Cv {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  education!: string;

  @Field()
  description!: string;

  @Field(() => ID)
  userId!: string;

  /** The "Employee" column: the email of the CV's owner. */
  @Field()
  ownerEmail!: string;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
