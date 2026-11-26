import { Field, ID, ObjectType } from "@nestjs/graphql";
import { Role } from "../../auth/models/role.enum";
import { Department } from "../../departments/models/department";
import { Position } from "../../positions/models/position";

/**
 * A user as the Users page and User Details see them (any signed-in user may read them, PLAN.md §8). No password
 * hash and no session data: the service never selects them (users page AC-18, AC-26).
 */
@ObjectType()
export class User {
  @Field(() => ID)
  id!: string;

  @Field()
  email!: string;

  /** Empty until the user fills in the profile: sign-up takes only email and password. */
  @Field(() => String, { nullable: true })
  firstName!: string | null;

  @Field(() => String, { nullable: true })
  lastName!: string | null;

  @Field(() => Role)
  role!: Role;

  /** Empty for a user who signed up and has not filled in the profile yet. */
  @Field(() => Department, { nullable: true })
  department!: Department | null;

  @Field(() => Position, { nullable: true })
  position!: Position | null;

  /** When the account was created: "Member since" on the Profile tab (user profile AC-14, read-only). */
  @Field()
  createdAt!: Date;

  /**
   * The avatar's address for `<img src>` (`GET /api/users/:id/avatar?v=<upload time>`, D11); `null` when the user
   * has no avatar, so the page shows the initials. A new upload gives a new address (no stale cached image).
   */
  @Field(() => String, { nullable: true })
  avatarUrl!: string | null;
}
