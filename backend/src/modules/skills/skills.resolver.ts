import { ParseUUIDPipe } from "@nestjs/common";
import { Args, ID, Mutation, Query, Resolver } from "@nestjs/graphql";
import { Roles } from "../../common/auth";
import { ListArgs } from "../../common/pagination";
import { Role } from "../auth/models/role.enum";
import { EnvironmentSkill } from "../projects/models/environment-skill";
import { CreateSkillInput } from "./dto/create-skill.input";
import { UpdateSkillInput } from "./dto/update-skill.input";
import { Skill } from "./models/skill";
import { SkillCategory } from "./models/skill-category";
import { SkillPage } from "./models/skill-page";
import { SkillsService } from "./skills.service";

/** The skills catalog is for admins only (PLAN.md §8); the guards enforce it for every operation. */
@Roles(Role.ADMIN)
@Resolver(() => Skill)
export class SkillsResolver {
  constructor(private readonly service: SkillsService) {}

  /** Every skill as `{ id, name }`, for the Environment field of the project forms. */
  @Query(() => [EnvironmentSkill], { name: "skills" })
  list(): Promise<EnvironmentSkill[]> {
    return this.service.list();
  }

  /** One page of the catalog for the admin Skills page. */
  @Query(() => SkillPage, { name: "skillCatalog" })
  listPage(@Args() args: ListArgs): Promise<SkillPage> {
    return this.service.listPage(args);
  }

  @Query(() => [SkillCategory], { name: "skillCategories" })
  listCategories(): Promise<SkillCategory[]> {
    return this.service.listCategories();
  }

  @Mutation(() => Skill)
  createSkill(@Args("input") input: CreateSkillInput): Promise<Skill> {
    return this.service.create(input);
  }

  @Mutation(() => Skill)
  updateSkill(@Args("input") input: UpdateSkillInput): Promise<Skill> {
    return this.service.update(input);
  }

  @Mutation(() => Boolean)
  async deleteSkill(@Args("id", { type: () => ID }, ParseUUIDPipe) id: string): Promise<boolean> {
    await this.service.delete(id);
    return true;
  }
}
