import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import type { EnvironmentSkill } from "../projects/models/environment-skill";

@Injectable()
export class SkillsService {
  constructor(private readonly prisma: PrismaService) {}

  /** The whole skills catalog, ordered by name. */
  list(): Promise<EnvironmentSkill[]> {
    return this.prisma.skill.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  }
}
