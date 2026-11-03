import { Module } from "@nestjs/common";
import { ProjectRolesResolver } from "./project-roles.resolver";
import { ProjectRolesService } from "./project-roles.service";
import { ProjectsResolver } from "./projects.resolver";
import { ProjectsService } from "./projects.service";

@Module({
  providers: [ProjectsResolver, ProjectsService, ProjectRolesResolver, ProjectRolesService],
})
export class ProjectsModule {}
