import { ParseUUIDPipe } from "@nestjs/common";
import { Args, ID, Mutation, Query, Resolver } from "@nestjs/graphql";
import { type AuthUser, CurrentUser, requireUser, Roles } from "../../common/auth";
import { ListArgs } from "../../common/pagination";
import { Role } from "../auth/models/role.enum";
import { CreateUserInput } from "./dto/create-user.input";
import { UpdateUserInput } from "./dto/update-user.input";
import { User } from "./models/user";
import { UserPage } from "./models/user-page";
import { UsersService } from "./users.service";

/**
 * Every signed-in user may read users (the global guard refuses anonymous calls); only admins may create,
 * update and delete them (PLAN.md §8, users page AC-12, AC-21, AC-30). Reading needs no verified email (D16).
 */
@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly service: UsersService) {}

  @Query(() => UserPage, { name: "users" })
  list(@Args() args: ListArgs): Promise<UserPage> {
    return this.service.list(args);
  }

  @Query(() => User)
  user(@Args("id", { type: () => ID }, ParseUUIDPipe) id: string): Promise<User> {
    return this.service.findOne(id);
  }

  @Roles(Role.ADMIN)
  @Mutation(() => User)
  createUser(@Args("input") input: CreateUserInput): Promise<User> {
    return this.service.create(input);
  }

  @Roles(Role.ADMIN)
  @Mutation(() => User)
  updateUser(
    @CurrentUser() actor: AuthUser | undefined,
    @Args("input") input: UpdateUserInput,
  ): Promise<User> {
    return this.service.update(input, requireUser(actor).id);
  }

  @Roles(Role.ADMIN)
  @Mutation(() => Boolean)
  async deleteUser(
    @CurrentUser() actor: AuthUser | undefined,
    @Args("id", { type: () => ID }, ParseUUIDPipe) id: string,
  ): Promise<boolean> {
    await this.service.delete(id, requireUser(actor).id);
    return true;
  }
}
