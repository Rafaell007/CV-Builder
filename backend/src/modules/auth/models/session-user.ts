import { Field, ID, ObjectType } from "@nestjs/graphql";
import { Role } from "./role.enum";

/** The signed-in user as the frontend needs it: who they are and what they may do (`me`, `signIn`). */
@ObjectType()
export class SessionUser {
  @Field(() => ID)
  id!: string;

  @Field()
  email!: string;

  @Field(() => Role)
  role!: Role;

  @Field()
  isVerified!: boolean;

  @Field(() => String, { nullable: true })
  firstName!: string | null;

  @Field(() => String, { nullable: true })
  lastName!: string | null;
}
