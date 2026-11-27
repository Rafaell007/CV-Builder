import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import type { ProjectRole } from "./models/project-role";

@Injectable()
export class ProjectRolesService {
  constructor(private readonly prisma: PrismaService) {}

  list(): Promise<ProjectRole[]> {
    return this.prisma.projectRole.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  }
}
