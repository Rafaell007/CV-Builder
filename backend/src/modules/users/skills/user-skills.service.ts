import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { AuthUser } from "../../../common/auth";
import { ValidationFailedException } from "../../../common/errors";
import { Prisma } from "../../../generated/prisma/client";
import { PrismaService } from "../../../prisma/prisma.service";
import { canonicalId, lockActorAndTarget, toTransactionConflict } from "../user-lock";
import type { AddUserSkillInput } from "./dto/add-user-skill.input";
import type { RemoveUserSkillsInput } from "./dto/remove-user-skills.input";
import type { UpdateUserSkillInput } from "./dto/update-user-skill.input";
import type { UserSkill } from "./models/user-skill";

const WITH_CATEGORY = {
  skill: {
    select: { id: true, name: true, category: { select: { id: true, name: true, type: true } } },
  },
} satisfies Prisma.UserSkillInclude;

// Categories first, as the page groups by them; the id keeps the order stable when names are equal.
const SKILL_ORDER = [
  { skill: { category: { name: "asc" } } },
  { skill: { name: "asc" } },
  { id: "asc" },
] satisfies Prisma.UserSkillOrderByWithRelationInput[];

type UserSkillRow = Prisma.UserSkillGetPayload<{ include: typeof WITH_CATEGORY }>;

/**
 * The skills of one user (user skills page, Skills page). Every signed-in user may read them; only the
 * owner or an admin may change them. The writes lock the actor and the user like `UsersService.updateProfile`,
 * with the same order of checks: `FORBIDDEN` (neither the owner nor an admin, also for an unknown user, so a
 * user cannot probe ids), `NOT_FOUND`, then the input. Removing a skill also removes it from the user's CVs (D13).
 */
@Injectable()
export class UserSkillsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string): Promise<UserSkill[]> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (user === null) throw new NotFoundException("User not found");
    const rows = await this.prisma.userSkill.findMany({
      where: { userId },
      include: WITH_CATEGORY,
      orderBy: SKILL_ORDER,
    });
    return rows.map(toUserSkill);
  }

  async add(
    actor: AuthUser,
    { userId: sentUserId, skillId, mastery }: AddUserSkillInput,
  ): Promise<UserSkill> {
    const userId = canonicalId(sentUserId);
    try {
      return await this.prisma.$transaction(async (tx) => {
        await lockActorAndTarget(tx, userId, actor.id, { ownerMayAct: true });
        const skill = await tx.skill.findUnique({ where: { id: skillId }, select: { id: true } });
        if (skill === null) throw skillNotFound();
        const row = await tx.userSkill.create({
          data: { userId, skillId, mastery },
          include: WITH_CATEGORY,
        });
        return toUserSkill(row);
      });
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }

  async update(actor: AuthUser, { id, mastery }: UpdateUserSkillInput): Promise<UserSkill> {
    // The user is found through the link, so a user cannot change a link of another user by sending its id.
    const existing = await this.prisma.userSkill.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (existing === null) throw userSkillNotFound();
    try {
      return await this.prisma.$transaction(async (tx) => {
        await lockActorAndTarget(tx, existing.userId, actor.id, { ownerMayAct: true });
        const row = await tx.userSkill.update({
          // The user id stays in the filter: the link cannot have moved, but the write never leaves this user.
          where: { id, userId: existing.userId },
          data: { mastery },
          include: WITH_CATEGORY,
        });
        return toUserSkill(row);
      });
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }

  /**
   * Removes the links from the user and the same skills from the user's CVs (D13). The catalog skills stay.
   * One id that does not belong to this user: nothing is removed.
   */
  async remove(actor: AuthUser, { userId: sentUserId, ids }: RemoveUserSkillsInput): Promise<void> {
    const userId = canonicalId(sentUserId);
    try {
      await this.prisma.$transaction(async (tx) => {
        await lockActorAndTarget(tx, userId, actor.id, { ownerMayAct: true });
        const links = await tx.userSkill.findMany({
          where: { id: { in: ids }, userId },
          select: { skillId: true },
        });
        if (links.length !== ids.length) throw userSkillNotFound();
        const skillIds = links.map((link) => link.skillId);
        await tx.cvSkill.deleteMany({ where: { skillId: { in: skillIds }, cv: { userId } } });
        await tx.userSkill.deleteMany({ where: { id: { in: ids }, userId } });
      });
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }
}

function userSkillNotFound(): NotFoundException {
  return new NotFoundException("User skill not found");
}

function skillNotFound(): ValidationFailedException {
  return new ValidationFailedException([{ field: "skillId", messages: ["Skill not found"] }]);
}

/**
 * - P2002: the user already has the skill (the unique index). It also covers two requests that add the
 *   same skill at the same time.
 * - P2003: the skill was deleted from the catalog after the check.
 * - P2025: the link was deleted before the update (the user lock makes this rare: only a delete of the user).
 * - P2034, P2028: the transaction was stopped; nothing was saved (`CONCURRENT_CHANGE`).
 */
function translateDatabaseError(error: unknown): unknown {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return error;
  switch (error.code) {
    case "P2002":
      return new ConflictException("The user already has this skill");
    case "P2003":
      return skillNotFound();
    case "P2025":
      return userSkillNotFound();
    default:
      return toTransactionConflict(error);
  }
}

function toUserSkill({ skill, ...link }: UserSkillRow): UserSkill {
  return { ...link, skillId: skill.id, name: skill.name, category: skill.category };
}
