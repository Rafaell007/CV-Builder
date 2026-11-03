import { ParseUUIDPipe } from "@nestjs/common";
import { Args, ID, Mutation, Query, Resolver } from "@nestjs/graphql";
import { Roles } from "../../common/auth";
import { ListArgs } from "../../common/pagination";
import { Role } from "../auth/models/role.enum";
import { CreateProjectInput } from "./dto/create-project.input";
import { UpdateProjectInput } from "./dto/update-project.input";
import { Project } from "./models/project";
import { ProjectPage } from "./models/project-page";
import { ProjectsService } from "./projects.service";

/** The project catalog is for admins only (PLAN.md §8); the guards enforce it for every operation. */
@Roles(Role.ADMIN)
@Resolver(() => Project)
export class ProjectsResolver {
  constructor(private readonly service: ProjectsService) {}

  @Query(() => ProjectPage, { name: "projects" })
  list(@Args() args: ListArgs): Promise<ProjectPage> {
    return this.service.list(args);
  }

  @Mutation(() => Project)
  createProject(@Args("input") input: CreateProjectInput): Promise<Project> {
    return this.service.create(input);
  }

  @Mutation(() => Project)
  updateProject(@Args("input") input: UpdateProjectInput): Promise<Project> {
    return this.service.update(input);
  }

  @Mutation(() => Boolean)
  async deleteProject(@Args("id", { type: () => ID }, ParseUUIDPipe) id: string): Promise<boolean> {
    await this.service.delete(id);
    return true;
  }
}
