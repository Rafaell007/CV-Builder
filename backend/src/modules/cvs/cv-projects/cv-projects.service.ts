import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { AuthUser } from "../../../common/auth";
import { ValidationFailedException } from "../../../common/errors";
import { resolveSort } from "../../../common/pagination";
import type { ResolvedSort } from "../../../common/pagination";
import { Prisma } from "../../../generated/prisma/client";
import { PrismaService } from "../../../prisma/prisma.service";
import type { Project } from "../../projects/models/project";
import { toProject, WITH_ENVIRONMENT } from "../../projects/project-environment";
import { resolveCvProjectDates } from "./cv-project-dates";
import { CvsService } from "../cvs.service";
import type { AddCvProjectInput } from "./dto/add-cv-project.input";
import type { CvProjectsArgs } from "./dto/cv-projects.args";
import type { RemoveCvProjectsInput } from "./dto/remove-cv-projects.input";
import type { UpdateCvProjectInput } from "./dto/update-cv-project.input";
import type { CvProject } from "./models/cv-project";

const SORT_FIELDS = ["name", "startDate", "endDate"] as const;
type SortField = (typeof SORT_FIELDS)[number];

const WITH_PROJECT_AND_ROLES = {
  project: { include: WITH_ENVIRONMENT },
  roles: {
    select: { role: { select: { id: true, name: true } } },
    orderBy: { role: { name: "asc" } },
  },
} satisfies Prisma.CvProjectInclude;

type CvProjectRow = Prisma.CvProjectGetPayload<{ include: typeof WITH_PROJECT_AND_ROLES }>;

/**
 * The projects of one CV (CV projects page). The CV decides who may use them: the owner and
 * admins, with the same rule as the CV itself (`CvsService.assertAccessible`).
 */
@Injectable()
export class CvProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cvs: CvsService,
  ) {}

  async list(user: AuthUser, { cvId, search, sort }: CvProjectsArgs): Promise<CvProject[]> {
    await this.cvs.assertAccessible(user, cvId);
    const { field, direction } = resolveSort(sort, SORT_FIELDS, {
      field: "name",
      direction: "asc",
    });
    const rows = await this.prisma.cvProject.findMany({
      // The CV id is always part of the filter: a search never leaves the selected CV (AC-40).
      where: { cvId, ...(search ? { project: { OR: searchConditions(search) } } : {}) },
      include: WITH_PROJECT_AND_ROLES,
      // The id keeps the order stable when the sorted values are equal.
      orderBy: [orderBy(field, direction), { id: "asc" }],
    });
    return rows.map(toCvProject);
  }

  /**
   * The projects of the catalog that are not yet in the CV: the options of the Add project modal (AC-31).
   * The CV decides who may ask, so a user without access to the CV gets no catalog. The CV id is part of the
   * filter, so the answer never depends on another CV.
   */
  async listAvailable(user: AuthUser, cvId: string): Promise<Project[]> {
    await this.cvs.assertAccessible(user, cvId);
    const rows = await this.prisma.project.findMany({
      where: { cvProjects: { none: { cvId } } },
      include: WITH_ENVIRONMENT,
      // The id keeps the order stable when names are equal.
      orderBy: [{ name: "asc" }, { id: "asc" }],
    });
    return rows.map(toProject);
  }

  async add(user: AuthUser, input: AddCvProjectInput): Promise<CvProject> {
    await this.cvs.assertAccessible(user, input.cvId);

    const row = await this.inTransaction((tx) => this.createEntry(tx, input));
    return toCvProject(row);
  }

  async update(user: AuthUser, input: UpdateCvProjectInput): Promise<CvProject> {
    const existing = await this.prisma.cvProject.findUnique({
      where: { id: input.id },
      select: { cvId: true },
    });
    if (existing === null) throw cvProjectNotFound();
    await this.cvs.assertAccessible(user, existing.cvId);

    const row = await this.inTransaction((tx) => this.changeEntry(tx, input));
    return toCvProject(row);
  }

  /** Removes the entries from the CV. The projects and the roles of the catalogs stay (AC-23, AC-39). */
  async remove(user: AuthUser, { cvId, ids }: RemoveCvProjectsInput): Promise<void> {
    await this.cvs.assertAccessible(user, cvId);
    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.cvProject.deleteMany({ where: { id: { in: ids }, cvId } });
      // One id that is not in this CV: nothing is removed.
      if (count !== ids.length) throw cvProjectNotFound();
    });
  }

  private async createEntry(
    tx: Prisma.TransactionClient,
    { cvId, projectId, roleIds, responsibilities, ...dates }: AddCvProjectInput,
  ): Promise<CvProjectRow> {
    await this.assertRolesExist(tx, roleIds);
    const project = await tx.project.findUnique({
      where: { id: projectId },
      select: { startDate: true, endDate: true },
    });
    if (project === null) {
      throw new ValidationFailedException([
        { field: "projectId", messages: ["Project not found"] },
      ]);
    }
    return tx.cvProject.create({
      data: {
        cvId,
        projectId,
        ...resolveCvProjectDates(dates, project),
        responsibilities: emptyToNull(responsibilities),
        roles: { create: roleIds.map((roleId) => ({ roleId })) },
      },
      include: WITH_PROJECT_AND_ROLES,
    });
  }

  private async changeEntry(
    tx: Prisma.TransactionClient,
    { id, roleIds, responsibilities, ...dates }: UpdateCvProjectInput,
  ): Promise<CvProjectRow> {
    await this.assertRolesExist(tx, roleIds);
    const entry = await tx.cvProject.findUnique({
      where: { id },
      select: { project: { select: { startDate: true, endDate: true } } },
    });
    if (entry === null) throw cvProjectNotFound();
    return tx.cvProject.update({
      where: { id },
      data: {
        // The project is not in the data: it cannot change (AC-19).
        ...resolveCvProjectDates(dates, entry.project),
        responsibilities: emptyToNull(responsibilities),
        // Replaces all roles of the entry.
        roles: { deleteMany: {}, create: roleIds.map((roleId) => ({ roleId })) },
      },
      include: WITH_PROJECT_AND_ROLES,
    });
  }

  /** Runs inside the serializable transaction, so a role that is deleted at the same time cannot slip through. */
  private async assertRolesExist(tx: Prisma.TransactionClient, roleIds: string[]): Promise<void> {
    const found = await tx.projectRole.count({ where: { id: { in: roleIds } } });
    if (found !== roleIds.length) {
      throw new ValidationFailedException([
        { field: "roleIds", messages: ["roleIds must contain only existing roles"] },
      ]);
    }
  }

  /**
   * Serializable: when the project dates change at the same time (D25), one of the two requests
   * fails, so no entry ends up outside the dates of its project. The database errors that can
   * still happen are turned into answers the user can understand.
   */
  private async inTransaction<T>(work: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    try {
      return await this.prisma.$transaction(work, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }
}

/** Search matches the name and the domain of the project, without regard to case. */
function searchConditions(search: string): Prisma.ProjectWhereInput[] {
  const contains = { contains: search, mode: "insensitive" as const };
  return [{ name: contains }, { domain: contains }];
}

function orderBy(
  field: SortField,
  direction: ResolvedSort<SortField>["direction"],
): Prisma.CvProjectOrderByWithRelationInput {
  switch (field) {
    case "name":
      return { project: { name: direction } };
    case "startDate":
      return { startDate: direction };
    case "endDate":
      // "Present" (no end date) counts as the latest end: last when ascending, first when descending.
      return { endDate: { sort: direction, nulls: direction === "asc" ? "last" : "first" } };
  }
}

/** The form sends an empty text when the person writes nothing; the database stores no value. */
function emptyToNull(text: string | null | undefined): string | null {
  return text === undefined || text === null || text === "" ? null : text;
}

function cvProjectNotFound(): NotFoundException {
  return new NotFoundException("CV project not found");
}

/**
 * - P2002: the project is already in this CV (the unique index, AC-31). It also covers two
 *   requests that add the same project at the same time.
 * - P2034: another request changed the same data at the same time.
 * - P2003: the CV was deleted after the access check. The project and the roles are checked
 *   inside the same serializable transaction, so a parallel delete of them gives P2034 instead.
 */
function translateDatabaseError(error: unknown): unknown {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return error;
  switch (error.code) {
    case "P2002":
      return new ConflictException("The project is already in this CV");
    case "P2034":
      return new ConflictException("The CV was changed at the same time. Try again");
    case "P2003":
      return new NotFoundException("CV not found");
    case "P2025":
      return cvProjectNotFound();
    default:
      return error;
  }
}

function toCvProject({ project, roles, ...entry }: CvProjectRow): CvProject {
  return { ...entry, project: toProject(project), roles: roles.map(({ role }) => role) };
}
