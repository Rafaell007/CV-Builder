import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { ValidationFailedException } from "../../common/errors";
import { ListArgs, resolveSort, toSkipTake } from "../../common/pagination";
import { Prisma } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import type { EnvironmentSkill } from "../projects/models/environment-skill";
import type { CreateSkillInput } from "./dto/create-skill.input";
import type { UpdateSkillInput } from "./dto/update-skill.input";
import type { Skill } from "./models/skill";
import type { SkillCategory } from "./models/skill-category";
import type { SkillPage } from "./models/skill-page";

const SORT_FIELDS = ["name"] as const;

/** The fields of a skill that the API returns; the type comes with the category. */
const SKILL_SELECT = {
  id: true,
  name: true,
  category: { select: { id: true, name: true, type: true } },
} satisfies Prisma.SkillSelect;

/** Turns the database errors of a skill write into API errors; any other error is returned unchanged. */
function toSkillWriteError(error: unknown): unknown {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return new ConflictException("Skill already exists");
    // The only foreign key of a skill is its category, so P2003 means the category does not exist.
    if (error.code === "P2003") {
      return new ValidationFailedException([
        { field: "categoryId", messages: ["Category not found"] },
      ]);
    }
  }
  return error;
}

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

  /** One page of the catalog for the admin page: search by name (any letter case), sort by name. */
  async listPage({ search, sort, page }: ListArgs): Promise<SkillPage> {
    const { field, direction } = resolveSort(sort, SORT_FIELDS, {
      field: "name",
      direction: "asc",
    });
    const where: Prisma.SkillWhereInput = search
      ? { name: { contains: search, mode: "insensitive" } }
      : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.skill.findMany({
        where,
        select: SKILL_SELECT,
        orderBy: [{ [field]: direction }, { id: "asc" }],
        ...toSkipTake(page),
      }),
      this.prisma.skill.count({ where }),
    ]);
    return { items, total };
  }

  /** Every skill category, ordered by name, for the Category field of the skill forms. */
  listCategories(): Promise<SkillCategory[]> {
    return this.prisma.skillCategory.findMany({
      select: { id: true, name: true, type: true },
      orderBy: { name: "asc" },
    });
  }

  async create({ name, categoryId }: CreateSkillInput): Promise<Skill> {
    try {
      return await this.prisma.skill.create({ data: { name, categoryId }, select: SKILL_SELECT });
    } catch (error) {
      throw toSkillWriteError(error);
    }
  }

  async update({ id, name, categoryId }: UpdateSkillInput): Promise<Skill> {
    try {
      return await this.prisma.skill.update({
        where: { id },
        data: { name, categoryId },
        select: SKILL_SELECT,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new NotFoundException("Skill not found");
      }
      throw toSkillWriteError(error);
    }
  }

  /** A skill that a user, a CV or a project still uses cannot be deleted (D18); the database refuses it. */
  async delete(id: string): Promise<void> {
    try {
      await this.prisma.skill.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2003") {
          throw new ConflictException("Skill cannot be deleted because it is currently in use");
        }
        if (error.code === "P2025") throw new NotFoundException("Skill not found");
      }
      throw error;
    }
  }
}
