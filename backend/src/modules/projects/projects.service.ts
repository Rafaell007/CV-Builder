import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { ValidationFailedException } from "../../common/errors";
import { ListArgs, resolveSort, toSkipTake } from "../../common/pagination";
import { Prisma } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import type { CreateProjectInput } from "./dto/create-project.input";
import type { UpdateProjectInput } from "./dto/update-project.input";
import type { Project } from "./models/project";
import type { ProjectPage } from "./models/project-page";
import { normalizeProjectDates } from "./project-dates";

const SORT_FIELDS = ["name", "startDate", "endDate"] as const;

const WITH_ENVIRONMENT = {
  skills: {
    select: { skill: { select: { id: true, name: true } } },
    orderBy: { skill: { name: "asc" } },
  },
} satisfies Prisma.ProjectInclude;

type ProjectRow = Prisma.ProjectGetPayload<{ include: typeof WITH_ENVIRONMENT }>;

function toProject({ skills, ...project }: ProjectRow): Project {
  return { ...project, environment: skills.map(({ skill }) => skill) };
}

function countLabel(count: number): string {
  return `${count} ${count === 1 ? "CV" : "CVs"}`;
}

/** The admin catalog of projects (PLAN.md §7, D18, D25). */
@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async list({ search, sort, page }: ListArgs): Promise<ProjectPage> {
    const { field, direction } = resolveSort(sort, SORT_FIELDS, {
      field: "name",
      direction: "asc",
    });
    const where: Prisma.ProjectWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { domain: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where,
        include: WITH_ENVIRONMENT,
        // The id makes the order stable, so a project cannot appear on two pages.
        orderBy: [{ [field]: direction }, { id: "asc" }],
        ...toSkipTake(page),
      }),
      this.prisma.project.count({ where }),
    ]);
    return { items: rows.map(toProject), total };
  }

  async create(input: CreateProjectInput): Promise<Project> {
    const dates = normalizeProjectDates(input.startDate, input.endDate);
    await this.assertSkillsExist(input.environmentIds);

    const row = await this.prisma.project.create({
      data: {
        name: input.name,
        domain: input.domain,
        description: input.description,
        ...dates,
        skills: { create: input.environmentIds.map((skillId) => ({ skillId })) },
      },
      include: WITH_ENVIRONMENT,
    });
    return toProject(row);
  }

  async update(input: UpdateProjectInput): Promise<Project> {
    const dates = normalizeProjectDates(input.startDate, input.endDate);
    const existing = await this.prisma.project.findUnique({
      where: { id: input.id },
      select: { startDate: true, endDate: true },
    });
    if (existing === null) throw new NotFoundException("Project not found");
    await this.assertSkillsExist(input.environmentIds);

    const datesChanged =
      existing.startDate.getTime() !== dates.startDate.getTime() ||
      existing.endDate.getTime() !== dates.endDate.getTime();
    if (datesChanged) await this.assertCvProjectsFitDates(input.id, dates);

    const row = await this.prisma.project.update({
      where: { id: input.id },
      data: {
        name: input.name,
        domain: input.domain,
        description: input.description,
        ...dates,
        // Replaces the whole environment; the nested write runs in one transaction.
        skills: { deleteMany: {}, create: input.environmentIds.map((skillId) => ({ skillId })) },
      },
      include: WITH_ENVIRONMENT,
    });
    return toProject(row);
  }

  async delete(id: string): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      select: { _count: { select: { cvProjects: true } } },
    });
    if (project === null) throw new NotFoundException("Project not found");
    const cvCount = project._count.cvProjects;
    if (cvCount > 0) {
      throw new ConflictException(`The project is used in ${countLabel(cvCount)}`);
    }

    try {
      await this.prisma.project.delete({ where: { id } });
    } catch (error) {
      // A CV added the project after the check above; the database still refuses (D18).
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        throw new ConflictException("The project is used in a CV");
      }
      throw error;
    }
  }

  private async assertSkillsExist(skillIds: string[]): Promise<void> {
    if (skillIds.length === 0) return;
    const found = await this.prisma.skill.count({ where: { id: { in: skillIds } } });
    if (found !== skillIds.length) {
      throw new ValidationFailedException([
        { field: "environmentIds", messages: ["environmentIds must contain only existing skills"] },
      ]);
    }
  }

  /** D25: CV project dates must stay within the project's dates. An empty CV end date means "Present". */
  private async assertCvProjectsFitDates(
    projectId: string,
    { startDate, endDate }: { startDate: Date; endDate: Date },
  ): Promise<void> {
    const outside = await this.prisma.cvProject.count({
      where: {
        projectId,
        OR: [
          { startDate: { lt: startDate } },
          { startDate: { gt: endDate } },
          { endDate: { lt: startDate } },
          { endDate: { gt: endDate } },
        ],
      },
    });
    if (outside > 0) {
      throw new ConflictException(
        `The new dates do not cover the project dates in ${countLabel(outside)}`,
      );
    }
  }
}
