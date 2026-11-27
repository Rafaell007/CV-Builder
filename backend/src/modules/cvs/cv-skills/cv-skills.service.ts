import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { AuthUser } from "../../../common/auth";
import { ValidationFailedException } from "../../../common/errors";
import { Prisma } from "../../../generated/prisma/client";
import type { Mastery } from "../../../generated/prisma/enums";
import { PrismaService } from "../../../prisma/prisma.service";
import { CvsService } from "../cvs.service";
import type { AddCvSkillInput } from "./dto/add-cv-skill.input";
import type { RemoveCvSkillsInput } from "./dto/remove-cv-skills.input";
import type { UpdateCvSkillInput } from "./dto/update-cv-skill.input";
import type { AvailableCvSkill } from "./models/available-cv-skill";
import type { CvSkill } from "./models/cv-skill";

const WITH_CATEGORY = {
  skill: {
    select: { id: true, name: true, category: { select: { id: true, name: true, type: true } } },
  },
} satisfies Prisma.CvSkillInclude;

// Categories first, as the page groups by them; the id keeps the order stable when names are equal.
const SKILL_ORDER = [
  { skill: { category: { name: "asc" } } },
  { skill: { name: "asc" } },
  { id: "asc" },
] satisfies Prisma.CvSkillOrderByWithRelationInput[];

type CvSkillRow = Prisma.CvSkillGetPayload<{ include: typeof WITH_CATEGORY }>;

/**
 * The skills of one CV (CV skills page). The CV decides who may use them: the owner and admins,
 * with the same rule as the CV itself (`CvsService.assertAccessible`). Only skills that the owner
 * of the CV has can be added (the owner's `UserSkill` rows).
 */
@Injectable()
export class CvSkillsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cvs: CvsService,
  ) {}

  async list(user: AuthUser, cvId: string): Promise<CvSkill[]> {
    await this.cvs.assertAccessible(user, cvId);
    const rows = await this.prisma.cvSkill.findMany({
      // The CV id is always part of the filter: a request never leaves the selected CV.
      where: { cvId },
      include: WITH_CATEGORY,
      orderBy: SKILL_ORDER,
    });
    return rows.map(toCvSkill);
  }

  /** The skills of the CV owner that are not yet in the CV. */
  async listAvailable(user: AuthUser, cvId: string): Promise<AvailableCvSkill[]> {
    const { ownerId } = await this.cvs.assertAccessible(user, cvId);
    const rows = await this.prisma.userSkill.findMany({
      where: { userId: ownerId, skill: { cvSkills: { none: { cvId } } } },
      select: {
        mastery: true,
        skill: {
          select: {
            id: true,
            name: true,
            category: { select: { id: true, name: true, type: true } },
          },
        },
      },
      orderBy: [
        { skill: { category: { name: "asc" } } },
        { skill: { name: "asc" } },
        { id: "asc" },
      ],
    });
    return rows.map(({ skill, mastery }) => ({ ...skill, mastery }));
  }

  async add(user: AuthUser, { cvId, skillId, mastery }: AddCvSkillInput): Promise<CvSkill> {
    const { ownerId } = await this.cvs.assertAccessible(user, cvId);
    try {
      return await this.prisma.$transaction(async (tx) => {
        // The owner's own skills are the only source: a skill id alone grants nothing (page doc, security).
        // FOR SHARE keeps the owner's skill until the link is saved, so a parallel `removeUserSkills` waits
        // and then removes the new link from the CV as well (D13). A remove that came first leaves no row here.
        // A tagged template: Prisma sends the ids as query parameters, never as SQL text.
        const [ownerSkill] = await tx.$queryRaw<{ mastery: Mastery }[]>`
          SELECT mastery FROM "UserSkill"
          WHERE "userId" = ${ownerId}::uuid AND "skillId" = ${skillId}::uuid
          FOR SHARE`;
        if (ownerSkill === undefined) {
          throw new ValidationFailedException([
            { field: "skillId", messages: ["Skill is not available for the owner of this CV"] },
          ]);
        }
        const row = await tx.cvSkill.create({
          data: { cvId, skillId, mastery: mastery ?? ownerSkill.mastery },
          include: WITH_CATEGORY,
        });
        return toCvSkill(row);
      });
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }

  async update(user: AuthUser, { id, mastery }: UpdateCvSkillInput): Promise<CvSkill> {
    // The CV is found through the link, so a user cannot change a link of another CV by sending its id.
    const existing = await this.prisma.cvSkill.findUnique({
      where: { id },
      select: { cvId: true },
    });
    if (existing === null) throw cvSkillNotFound();
    await this.cvs.assertAccessible(user, existing.cvId);

    try {
      const row = await this.prisma.cvSkill.update({
        where: { id },
        data: { mastery },
        include: WITH_CATEGORY,
      });
      return toCvSkill(row);
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }

  /** Removes the links from the CV. The skills of the catalog and of the owner stay. */
  async remove(user: AuthUser, { cvId, ids }: RemoveCvSkillsInput): Promise<void> {
    await this.cvs.assertAccessible(user, cvId);
    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.cvSkill.deleteMany({ where: { id: { in: ids }, cvId } });
      // One id that is not in this CV: nothing is removed.
      if (count !== ids.length) throw cvSkillNotFound();
    });
  }
}

function cvSkillNotFound(): NotFoundException {
  return new NotFoundException("CV skill not found");
}

/**
 * - P2002: the skill is already in this CV (the unique index). It also covers two requests that
 *   add the same skill at the same time.
 * - P2003: the CV or the skill was deleted after the checks.
 * - P2025: the link was deleted after the access check.
 */
function translateDatabaseError(error: unknown): unknown {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return error;
  switch (error.code) {
    case "P2002":
      return new ConflictException("The skill is already in this CV");
    case "P2003":
      return new NotFoundException("CV or skill not found");
    case "P2025":
      return cvSkillNotFound();
    default:
      return error;
  }
}

function toCvSkill({ skill, ...link }: CvSkillRow): CvSkill {
  return { ...link, skillId: skill.id, name: skill.name, category: skill.category };
}
