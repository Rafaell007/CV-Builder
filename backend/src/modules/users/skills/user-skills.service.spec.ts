import { ConflictException, ForbiddenException, NotFoundException } from "@nestjs/common";
import type { AuthUser } from "../../../common/auth";
import { ValidationFailedException } from "../../../common/errors";
import { Prisma } from "../../../generated/prisma/client";
import { Mastery } from "../../../generated/prisma/enums";
import type { PrismaService } from "../../../prisma/prisma.service";
import { Role } from "../../auth/models/role.enum";
import { UserSkillsService } from "./user-skills.service";

const OWNER_ID = "6f1d3c52-8a0e-4f6c-9a43-2b7d5e1c9a10";
const OTHER_ID = "0b8e9a3c-1f2d-4e5a-8b6c-7d9e0f1a2b3c";
const ADMIN_ID = "9c7b6a5d-4e3f-4a1b-9c8d-7e6f5a4b3c2d";
const SKILL_ID = "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d";

const OWNER: AuthUser = { id: OWNER_ID, role: Role.USER, isVerified: true };
const OTHER: AuthUser = { id: OTHER_ID, role: Role.USER, isVerified: true };
const ADMIN: AuthUser = { id: ADMIN_ID, role: Role.ADMIN, isVerified: true };

const CATEGORY = { id: "category-1", name: "Frontend", type: "FRONTEND" };
const CREATED_AT = new Date("2026-11-27T10:00:00.000Z");

const prisma = {
  user: { findUnique: jest.fn() },
  skill: { findUnique: jest.fn() },
  userSkill: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
  },
  cvSkill: { deleteMany: jest.fn() },
  $queryRaw: jest.fn(),
  $transaction: jest.fn(),
};

/** The rows `lockActorAndTarget` reads: the users that exist among the target and the actor. */
function lockedRows(...rows: { id: string; role: Role }[]): void {
  prisma.$queryRaw.mockResolvedValue(rows);
}

const owner = { id: OWNER_ID, role: Role.USER };
const other = { id: OTHER_ID, role: Role.USER };
const admin = { id: ADMIN_ID, role: Role.ADMIN };

function storedLink(overrides: Partial<{ id: string; mastery: Mastery }> = {}) {
  return {
    id: "link-1",
    userId: OWNER_ID,
    skillId: SKILL_ID,
    mastery: Mastery.ADVANCED,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    skill: { id: SKILL_ID, name: "React", category: CATEGORY },
    ...overrides,
  };
}

function prismaError(code: string): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError(code, { code, clientVersion: "7" });
}

function createService(): UserSkillsService {
  return new UserSkillsService(prisma as unknown as PrismaService);
}

beforeEach(() => {
  jest.resetAllMocks();
  prisma.$transaction.mockImplementation((work: (tx: typeof prisma) => Promise<unknown>) =>
    work(prisma),
  );
});

describe("UserSkillsService.list", () => {
  it("returns the user's skills flat, with the category, sorted by category and name", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: OWNER_ID });
    prisma.userSkill.findMany.mockResolvedValue([storedLink()]);

    await expect(createService().list(OWNER_ID)).resolves.toEqual([
      {
        id: "link-1",
        userId: OWNER_ID,
        skillId: SKILL_ID,
        name: "React",
        category: CATEGORY,
        mastery: Mastery.ADVANCED,
        createdAt: CREATED_AT,
        updatedAt: CREATED_AT,
      },
    ]);
    expect(prisma.userSkill.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: OWNER_ID },
        orderBy: [
          { skill: { category: { name: "asc" } } },
          { skill: { name: "asc" } },
          { id: "asc" },
        ],
      }),
    );
  });

  it("answers NOT_FOUND for an unknown user", async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(createService().list(OWNER_ID)).rejects.toThrow(NotFoundException);
    expect(prisma.userSkill.findMany).not.toHaveBeenCalled();
  });
});

describe("UserSkillsService.add", () => {
  const input = { userId: OWNER_ID, skillId: SKILL_ID, mastery: Mastery.ADVANCED };

  it("lets the owner add a skill", async () => {
    lockedRows(owner);
    prisma.skill.findUnique.mockResolvedValue({ id: SKILL_ID });
    prisma.userSkill.create.mockResolvedValue(storedLink());

    const result = await createService().add(OWNER, input);

    expect(result).toMatchObject({ id: "link-1", skillId: SKILL_ID, name: "React" });
    expect(prisma.userSkill.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { userId: OWNER_ID, skillId: SKILL_ID, mastery: Mastery.ADVANCED },
      }),
    );
  });

  it("lets an admin add a skill to another user", async () => {
    lockedRows(owner, admin);
    prisma.skill.findUnique.mockResolvedValue({ id: SKILL_ID });
    prisma.userSkill.create.mockResolvedValue(storedLink());

    await createService().add(ADMIN, input);

    expect(prisma.userSkill.create).toHaveBeenCalled();
  });

  it("matches a user id sent in upper case with the locked row", async () => {
    lockedRows(owner);
    prisma.skill.findUnique.mockResolvedValue({ id: SKILL_ID });
    prisma.userSkill.create.mockResolvedValue(storedLink());

    await createService().add(OWNER, { ...input, userId: OWNER_ID.toUpperCase() });

    expect(prisma.userSkill.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: OWNER_ID }) }),
    );
  });

  it("refuses another user as FORBIDDEN, before it looks at the skill", async () => {
    lockedRows(owner, other);

    await expect(createService().add(OTHER, input)).rejects.toThrow(ForbiddenException);
    expect(prisma.skill.findUnique).not.toHaveBeenCalled();
    expect(prisma.userSkill.create).not.toHaveBeenCalled();
  });

  it("answers BAD_USER_INPUT on skillId for a skill that is not in the catalog", async () => {
    lockedRows(owner);
    prisma.skill.findUnique.mockResolvedValue(null);

    const error = await createService()
      .add(OWNER, input)
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ValidationFailedException);
    expect((error as ValidationFailedException).fieldErrors).toEqual([
      { field: "skillId", messages: ["Skill not found"] },
    ]);
    expect(prisma.userSkill.create).not.toHaveBeenCalled();
  });

  it("answers CONFLICT when the user already has the skill", async () => {
    lockedRows(owner);
    prisma.skill.findUnique.mockResolvedValue({ id: SKILL_ID });
    prisma.userSkill.create.mockRejectedValue(prismaError("P2002"));

    await expect(createService().add(OWNER, input)).rejects.toThrow(ConflictException);
  });

  it("answers BAD_USER_INPUT when the skill was deleted after the check", async () => {
    lockedRows(owner);
    prisma.skill.findUnique.mockResolvedValue({ id: SKILL_ID });
    prisma.userSkill.create.mockRejectedValue(prismaError("P2003"));

    await expect(createService().add(OWNER, input)).rejects.toThrow(ValidationFailedException);
  });

  it("turns a transaction timeout into a CONFLICT to try again", async () => {
    prisma.$transaction.mockRejectedValue(prismaError("P2028"));

    await expect(createService().add(OWNER, input)).rejects.toThrow(ConflictException);
  });
});

describe("UserSkillsService.update", () => {
  const input = { id: "link-1", mastery: Mastery.EXPERT };

  it("lets the owner change the mastery, and finds the user through the link", async () => {
    prisma.userSkill.findUnique.mockResolvedValue({ userId: OWNER_ID });
    lockedRows(owner);
    prisma.userSkill.update.mockResolvedValue(storedLink({ mastery: Mastery.EXPERT }));

    const result = await createService().update(OWNER, input);

    expect(result.mastery).toBe(Mastery.EXPERT);
    expect(prisma.userSkill.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "link-1", userId: OWNER_ID },
        data: { mastery: Mastery.EXPERT },
      }),
    );
  });

  it("lets an admin change the skill of another user", async () => {
    prisma.userSkill.findUnique.mockResolvedValue({ userId: OWNER_ID });
    lockedRows(owner, admin);
    prisma.userSkill.update.mockResolvedValue(storedLink());

    await createService().update(ADMIN, input);

    expect(prisma.userSkill.update).toHaveBeenCalled();
  });

  it("refuses another user as FORBIDDEN", async () => {
    prisma.userSkill.findUnique.mockResolvedValue({ userId: OWNER_ID });
    lockedRows(owner, other);

    await expect(createService().update(OTHER, input)).rejects.toThrow(ForbiddenException);
    expect(prisma.userSkill.update).not.toHaveBeenCalled();
  });

  it("answers FORBIDDEN to a user and NOT_FOUND to an admin for an unknown link", async () => {
    prisma.userSkill.findUnique.mockResolvedValue(null);

    await expect(createService().update(OWNER, input)).rejects.toThrow(ForbiddenException);
    await expect(createService().update(ADMIN, input)).rejects.toThrow(NotFoundException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("answers NOT_FOUND when the link was removed before the update", async () => {
    prisma.userSkill.findUnique.mockResolvedValue({ userId: OWNER_ID });
    lockedRows(owner);
    prisma.userSkill.update.mockRejectedValue(prismaError("P2025"));

    await expect(createService().update(OWNER, input)).rejects.toThrow(NotFoundException);
  });
});

describe("UserSkillsService.remove", () => {
  const input = { userId: OWNER_ID, ids: ["link-1", "link-2"] };

  it("removes the links and the same skills from the user's CVs (D13)", async () => {
    lockedRows(owner);
    prisma.userSkill.findMany.mockResolvedValue([{ skillId: "skill-1" }, { skillId: "skill-2" }]);

    await createService().remove(OWNER, input);

    expect(prisma.cvSkill.deleteMany).toHaveBeenCalledWith({
      where: { skillId: { in: ["skill-1", "skill-2"] }, cv: { userId: OWNER_ID } },
    });
    expect(prisma.userSkill.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ["link-1", "link-2"] }, userId: OWNER_ID },
    });
  });

  it("treats one id sent twice in different letter case as one link", async () => {
    lockedRows(owner);
    prisma.userSkill.findMany.mockResolvedValue([{ skillId: "skill-1" }]);
    const id = "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d";

    await createService().remove(OWNER, { userId: OWNER_ID, ids: [id.toUpperCase(), id] });

    expect(prisma.userSkill.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: [id] }, userId: OWNER_ID },
    });
  });

  it("lets an admin remove the skills of another user", async () => {
    lockedRows(owner, admin);
    prisma.userSkill.findMany.mockResolvedValue([{ skillId: "skill-1" }, { skillId: "skill-2" }]);

    await createService().remove(ADMIN, input);

    expect(prisma.userSkill.deleteMany).toHaveBeenCalled();
  });

  it("refuses another user as FORBIDDEN and removes nothing", async () => {
    lockedRows(owner, other);

    await expect(createService().remove(OTHER, input)).rejects.toThrow(ForbiddenException);
    expect(prisma.cvSkill.deleteMany).not.toHaveBeenCalled();
    expect(prisma.userSkill.deleteMany).not.toHaveBeenCalled();
  });

  it("removes nothing when one id does not belong to the user", async () => {
    lockedRows(owner);
    prisma.userSkill.findMany.mockResolvedValue([{ skillId: "skill-1" }]);

    await expect(createService().remove(OWNER, input)).rejects.toThrow(NotFoundException);
    expect(prisma.cvSkill.deleteMany).not.toHaveBeenCalled();
    expect(prisma.userSkill.deleteMany).not.toHaveBeenCalled();
  });
});
