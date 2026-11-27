import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { CurrentUser, Verified } from "../../../common/auth";
import type { AuthUser } from "../../../common/auth";
import { Project } from "../../projects/models/project";
import { CvProjectsService } from "./cv-projects.service";
import { AddCvProjectInput } from "./dto/add-cv-project.input";
import { AvailableCvProjectsArgs } from "./dto/available-cv-projects.args";
import { CvProjectsArgs } from "./dto/cv-projects.args";
import { RemoveCvProjectsInput } from "./dto/remove-cv-projects.input";
import { UpdateCvProjectInput } from "./dto/update-cv-project.input";
import { CvProject } from "./models/cv-project";
import { requireUser } from "../../../common/auth";

/** Reading needs a session; adding, changing and removing also need a verified email (D16). */
@Resolver(() => CvProject)
export class CvProjectsResolver {
  constructor(private readonly service: CvProjectsService) {}

  @Query(() => [CvProject])
  cvProjects(
    @CurrentUser() user: AuthUser | undefined,
    @Args() args: CvProjectsArgs,
  ): Promise<CvProject[]> {
    return this.service.list(requireUser(user), args);
  }

  @Query(() => [Project])
  availableCvProjects(
    @CurrentUser() user: AuthUser | undefined,
    @Args() { cvId }: AvailableCvProjectsArgs,
  ): Promise<Project[]> {
    return this.service.listAvailable(requireUser(user), cvId);
  }

  @Verified()
  @Mutation(() => CvProject)
  addCvProject(
    @CurrentUser() user: AuthUser | undefined,
    @Args("input") input: AddCvProjectInput,
  ): Promise<CvProject> {
    return this.service.add(requireUser(user), input);
  }

  @Verified()
  @Mutation(() => CvProject)
  updateCvProject(
    @CurrentUser() user: AuthUser | undefined,
    @Args("input") input: UpdateCvProjectInput,
  ): Promise<CvProject> {
    return this.service.update(requireUser(user), input);
  }

  @Verified()
  @Mutation(() => Boolean)
  async removeCvProjects(
    @CurrentUser() user: AuthUser | undefined,
    @Args("input") input: RemoveCvProjectsInput,
  ): Promise<boolean> {
    await this.service.remove(requireUser(user), input);
    return true;
  }
}
