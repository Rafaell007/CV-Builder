import { Query, Resolver } from "@nestjs/graphql";
import { Roles } from "../../common/auth";
import { Role } from "../auth/models/role.enum";
import { EnvironmentSkill } from "../projects/models/environment-skill";
import { SkillsService } from "./skills.service";

/** The skills catalog is for admins only (PLAN.md §8); the guards enforce it for every operation. */
@Roles(Role.ADMIN)
@Resolver(() => EnvironmentSkill)
export class SkillsResolver {
  constructor(private readonly service: SkillsService) {}

  @Query(() => [EnvironmentSkill], { name: "skills" })
  list(): Promise<EnvironmentSkill[]> {
    return this.service.list();
  }
}
