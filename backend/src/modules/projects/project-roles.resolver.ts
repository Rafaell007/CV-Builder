import { Query, Resolver } from "@nestjs/graphql";
import { ProjectRole } from "./models/project-role";
import { ProjectRolesService } from "./project-roles.service";

/** Open to every signed-in user: CV forms (S7.4) list the roles too. */
@Resolver(() => ProjectRole)
export class ProjectRolesResolver {
  constructor(private readonly roles: ProjectRolesService) {}

  @Query(() => [ProjectRole])
  projectRoles(): Promise<ProjectRole[]> {
    return this.roles.list();
  }
}
