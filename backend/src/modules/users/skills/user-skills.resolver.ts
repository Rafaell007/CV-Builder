import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { CurrentUser, requireUser, Verified } from "../../../common/auth";
import type { AuthUser } from "../../../common/auth";
import { AddUserSkillInput } from "./dto/add-user-skill.input";
import { RemoveUserSkillsInput } from "./dto/remove-user-skills.input";
import { UpdateUserSkillInput } from "./dto/update-user-skill.input";
import { UserSkillsArgs } from "./dto/user-skills.args";
import { UserSkill } from "./models/user-skill";
import { UserSkillsService } from "./user-skills.service";

/** Reading needs a session; adding, changing and removing also need a verified email (D16). */
@Resolver(() => UserSkill)
export class UserSkillsResolver {
  constructor(private readonly service: UserSkillsService) {}

  @Query(() => [UserSkill])
  userSkills(@Args() { userId }: UserSkillsArgs): Promise<UserSkill[]> {
    return this.service.list(userId);
  }

  @Verified()
  @Mutation(() => UserSkill)
  addUserSkill(
    @CurrentUser() user: AuthUser | undefined,
    @Args("input") input: AddUserSkillInput,
  ): Promise<UserSkill> {
    return this.service.add(requireUser(user), input);
  }

  @Verified()
  @Mutation(() => UserSkill)
  updateUserSkill(
    @CurrentUser() user: AuthUser | undefined,
    @Args("input") input: UpdateUserSkillInput,
  ): Promise<UserSkill> {
    return this.service.update(requireUser(user), input);
  }

  @Verified()
  @Mutation(() => Boolean)
  async removeUserSkills(
    @CurrentUser() user: AuthUser | undefined,
    @Args("input") input: RemoveUserSkillsInput,
  ): Promise<boolean> {
    await this.service.remove(requireUser(user), input);
    return true;
  }
}
