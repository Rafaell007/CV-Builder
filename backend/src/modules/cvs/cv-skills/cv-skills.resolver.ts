import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { CurrentUser, Verified } from "../../../common/auth";
import type { AuthUser } from "../../../common/auth";
import { CvSkillsService } from "./cv-skills.service";
import { AddCvSkillInput } from "./dto/add-cv-skill.input";
import { CvSkillsArgs } from "./dto/cv-skills.args";
import { RemoveCvSkillsInput } from "./dto/remove-cv-skills.input";
import { UpdateCvSkillInput } from "./dto/update-cv-skill.input";
import { AvailableCvSkill } from "./models/available-cv-skill";
import { CvSkill } from "./models/cv-skill";
import { requireUser } from "../../../common/auth";

/** Reading needs a session; adding, changing and removing also need a verified email (D16). */
@Resolver(() => CvSkill)
export class CvSkillsResolver {
  constructor(private readonly service: CvSkillsService) {}

  @Query(() => [CvSkill])
  cvSkills(
    @CurrentUser() user: AuthUser | undefined,
    @Args() { cvId }: CvSkillsArgs,
  ): Promise<CvSkill[]> {
    return this.service.list(requireUser(user), cvId);
  }

  @Query(() => [AvailableCvSkill])
  availableCvSkills(
    @CurrentUser() user: AuthUser | undefined,
    @Args() { cvId }: CvSkillsArgs,
  ): Promise<AvailableCvSkill[]> {
    return this.service.listAvailable(requireUser(user), cvId);
  }

  @Verified()
  @Mutation(() => CvSkill)
  addCvSkill(
    @CurrentUser() user: AuthUser | undefined,
    @Args("input") input: AddCvSkillInput,
  ): Promise<CvSkill> {
    return this.service.add(requireUser(user), input);
  }

  @Verified()
  @Mutation(() => CvSkill)
  updateCvSkill(
    @CurrentUser() user: AuthUser | undefined,
    @Args("input") input: UpdateCvSkillInput,
  ): Promise<CvSkill> {
    return this.service.update(requireUser(user), input);
  }

  @Verified()
  @Mutation(() => Boolean)
  async removeCvSkills(
    @CurrentUser() user: AuthUser | undefined,
    @Args("input") input: RemoveCvSkillsInput,
  ): Promise<boolean> {
    await this.service.remove(requireUser(user), input);
    return true;
  }
}
