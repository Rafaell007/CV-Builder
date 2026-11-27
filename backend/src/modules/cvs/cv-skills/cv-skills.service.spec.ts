import { ConflictException, NotFoundException } from "@nestjs/common";
import type { AuthUser } from "../../../common/auth";
import { ValidationFailedException } from "../../../common/errors";
import { Prisma } from "../../../generated/prisma/client";
import { Mastery, Role } from "../../../generated/prisma/enums";
import type { PrismaService } from "../../../prisma/prisma.service";
import { CvSkillsService } from "./cv-skills.service";
import type { CvsService } from "../cvs.service";

const USER: AuthUser = { id: "user-1", role: Role.USER, isVerified: true };
const ADMIN: AuthUser = { id: "admin-1", role: Role.ADMIN, isVerified: true };

const transaction = jest.fn();
const prisma = {
  cvSkill: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
  },
  userSkill: { findMany: jest.fn(), findUnique: jest.fn() },
  $transaction: transaction,
};
// The work of a transaction runs against the same mock, as if it were the transaction client.
transaction.mockImplementation((work: (tx: unknown) => Promise<unknown>) => work(prisma));

const cvs = { assertAccessible: jest.fn() };

const CATEGORY = { id: "category-1", name: "Frontend" };

function storedLink(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "link-1",
    cvId: "cv-1",
    skillId: "skill-1",
    mastery: Mastery.ADVANCED,
    createdAt: new Date("2026-11-01T10:00:00.000Z"),
    updatedAt: new Date("2026-11-01T10:00:00.000Z"),
    skill: { id: "skill-1", name: "React", category: CATEGORY },
    ...overrides,
  };
}

async function rejection(call: Promise<unknown>): Promise<unknown> {
  try {
    await call;
  } catch (error) {
    return error;
  }
  throw new Error("The call did not fail");
}

function databaseError(code: string): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError("database error", {
    code,
    clientVersion: "test",
  });
}

function firstCall<T>(mock: jest.Mock): T {
  return (mock.mock.calls[0] as [T])[0];
}

const service = new CvSkillsService(
  prisma as unknown as PrismaService,
  cvs as unknown as CvsService,
);

beforeEach(() => {
  jest.clearAllMocks();
  cvs.assertAccessible.mockResolvedValue({ ownerId: "owner-1" });
  prisma.cvSkill.findMany.mockResolvedValue([storedLink()]);
  prisma.cvSkill.findUnique.mockResolvedValue({ cvId: "cv-1" });
  prisma.cvSkill.create.mockResolvedValue(storedLink());
  prisma.cvSkill.update.mockResolvedValue(storedLink({ mastery: Mastery.EXPERT }));
  prisma.cvSkill.deleteMany.mockResolvedValue({ count: 1 });
  prisma.userSkill.findUnique.mockResolvedValue({ mastery: Mastery.INTERMEDIATE });
});

describe("CvSkillsService.list", () => {
  it("returns the links with the skill name and the category as flat fields", async () => {
    const [link] = await service.list(USER, "cv-1");

    expect(link).toEqual({
      id: "link-1",
      cvId: "cv-1",
      skillId: "skill-1",
      name: "React",
      category: CATEGORY,
      mastery: Mastery.ADVANCED,
      createdAt: new Date("2026-11-01T10:00:00.000Z"),
      updatedAt: new Date("2026-11-01T10:00:00.000Z"),
    });
  });

  it("checks the access to the CV first and reads nothing when it fails", async () => {
    cvs.assertAccessible.mockRejectedValue(new NotFoundException("CV not found"));

    expect(await rejection(service.list(USER, "cv-2"))).toBeInstanceOf(NotFoundException);
    expect(cvs.assertAccessible).toHaveBeenCalledWith(USER, "cv-2");
    expect(prisma.cvSkill.findMany).not.toHaveBeenCalled();
  });

  it("lets an admin read the skills of the CV of another user", async () => {
    await service.list(ADMIN, "cv-1");

    expect(cvs.assertAccessible).toHaveBeenCalledWith(ADMIN, "cv-1");
  });

  it("reads only the selected CV and orders by category, then name", async () => {
    await service.list(USER, "cv-1");

    expect(firstCall<{ where: unknown; orderBy: unknown }>(prisma.cvSkill.findMany)).toMatchObject({
      where: { cvId: "cv-1" },
      orderBy: [
        { skill: { category: { name: "asc" } } },
        { skill: { name: "asc" } },
        { id: "asc" },
      ],
    });
  });
});

describe("CvSkillsService.listAvailable", () => {
  it("returns the skills of the owner that are not in the CV, with the owner's mastery", async () => {
    prisma.userSkill.findMany.mockResolvedValue([
      { mastery: Mastery.BEGINNER, skill: { id: "skill-2", name: "Vue", category: CATEGORY } },
    ]);

    const result = await service.listAvailable(USER, "cv-1");

    expect(result).toEqual([
      { id: "skill-2", name: "Vue", category: CATEGORY, mastery: Mastery.BEGINNER },
    ]);
    expect(firstCall<{ where: unknown }>(prisma.userSkill.findMany).where).toEqual({
      userId: "owner-1",
      skill: { cvSkills: { none: { cvId: "cv-1" } } },
    });
  });

  it("orders the available skills by category, then name, then id", async () => {
    prisma.userSkill.findMany.mockResolvedValue([]);

    await service.listAvailable(USER, "cv-1");

    expect(firstCall<{ orderBy: unknown }>(prisma.userSkill.findMany).orderBy).toEqual([
      { skill: { category: { name: "asc" } } },
      { skill: { name: "asc" } },
      { id: "asc" },
    ]);
  });

  it("uses the owner of the CV, also when an admin asks", async () => {
    prisma.userSkill.findMany.mockResolvedValue([]);

    await service.listAvailable(ADMIN, "cv-1");

    expect(firstCall<{ where: { userId: string } }>(prisma.userSkill.findMany).where.userId).toBe(
      "owner-1",
    );
  });

  it("reads nothing when the CV is not accessible", async () => {
    cvs.assertAccessible.mockRejectedValue(new NotFoundException("CV not found"));

    expect(await rejection(service.listAvailable(USER, "cv-2"))).toBeInstanceOf(NotFoundException);
    expect(prisma.userSkill.findMany).not.toHaveBeenCalled();
  });
});

describe("CvSkillsService.add", () => {
  it("adds a skill of the owner with the owner's mastery when none is sent", async () => {
    await service.add(USER, { cvId: "cv-1", skillId: "skill-1" });

    expect(prisma.userSkill.findUnique).toHaveBeenCalledWith({
      where: { userId_skillId: { userId: "owner-1", skillId: "skill-1" } },
      select: { mastery: true },
    });
    expect(firstCall<{ data: unknown }>(prisma.cvSkill.create).data).toEqual({
      cvId: "cv-1",
      skillId: "skill-1",
      mastery: Mastery.INTERMEDIATE,
    });
  });

  it("reads the skill and its category back with the new link", async () => {
    await service.add(USER, { cvId: "cv-1", skillId: "skill-1" });

    expect(firstCall<{ include: unknown }>(prisma.cvSkill.create).include).toEqual({
      skill: {
        select: {
          id: true,
          name: true,
          category: { select: { id: true, name: true, type: true } },
        },
      },
    });
  });

  it("uses the mastery from the request when one is sent", async () => {
    await service.add(USER, { cvId: "cv-1", skillId: "skill-1", mastery: Mastery.EXPERT });

    expect(firstCall<{ data: { mastery: Mastery } }>(prisma.cvSkill.create).data.mastery).toBe(
      Mastery.EXPERT,
    );
  });

  it("refuses a skill that the owner does not have, with a field error on skillId", async () => {
    prisma.userSkill.findUnique.mockResolvedValue(null);

    const error = await rejection(service.add(USER, { cvId: "cv-1", skillId: "skill-9" }));

    expect(error).toBeInstanceOf(ValidationFailedException);
    expect((error as ValidationFailedException).fieldErrors).toEqual([
      { field: "skillId", messages: ["Skill is not available for the owner of this CV"] },
    ]);
    expect(prisma.cvSkill.create).not.toHaveBeenCalled();
  });

  it("does not look at the owner skills when the CV is not accessible", async () => {
    cvs.assertAccessible.mockRejectedValue(new NotFoundException("CV not found"));

    expect(await rejection(service.add(USER, { cvId: "cv-2", skillId: "skill-1" }))).toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.userSkill.findUnique).not.toHaveBeenCalled();
    expect(prisma.cvSkill.create).not.toHaveBeenCalled();
  });

  it("turns the unique index error into CONFLICT", async () => {
    prisma.cvSkill.create.mockRejectedValue(databaseError("P2002"));

    expect(await rejection(service.add(USER, { cvId: "cv-1", skillId: "skill-1" }))).toBeInstanceOf(
      ConflictException,
    );
  });

  it("says in the message of the conflict that the skill is already in the CV", async () => {
    prisma.cvSkill.create.mockRejectedValue(databaseError("P2002"));

    await expect(service.add(USER, { cvId: "cv-1", skillId: "skill-1" })).rejects.toThrow(
      "The skill is already in this CV",
    );
  });

  it("turns a CV that was deleted in between into NOT_FOUND", async () => {
    prisma.cvSkill.create.mockRejectedValue(databaseError("P2003"));

    expect(await rejection(service.add(USER, { cvId: "cv-1", skillId: "skill-1" }))).toBeInstanceOf(
      NotFoundException,
    );
  });

  it("does not hide other database errors", async () => {
    const failure = databaseError("P1001");
    prisma.cvSkill.create.mockRejectedValue(failure);

    expect(await rejection(service.add(USER, { cvId: "cv-1", skillId: "skill-1" }))).toBe(failure);
  });

  it("does not hide an error that is not from the database", async () => {
    const failure = new Error("connection lost");
    prisma.cvSkill.create.mockRejectedValue(failure);

    expect(await rejection(service.add(USER, { cvId: "cv-1", skillId: "skill-1" }))).toBe(failure);
  });
});

describe("CvSkillsService.update", () => {
  it("changes only the mastery of the link", async () => {
    const result = await service.update(USER, { id: "link-1", mastery: Mastery.EXPERT });

    expect(result.mastery).toBe(Mastery.EXPERT);
    expect(firstCall<{ where: unknown; data: unknown }>(prisma.cvSkill.update)).toMatchObject({
      where: { id: "link-1" },
      data: { mastery: Mastery.EXPERT },
    });
  });

  it("looks up the link by its id and reads only the CV id", async () => {
    await service.update(USER, { id: "link-1", mastery: Mastery.EXPERT });

    expect(prisma.cvSkill.findUnique).toHaveBeenCalledWith({
      where: { id: "link-1" },
      select: { cvId: true },
    });
  });

  it("finds the CV through the link and checks the access to it", async () => {
    await service.update(ADMIN, { id: "link-1", mastery: Mastery.EXPERT });

    expect(cvs.assertAccessible).toHaveBeenCalledWith(ADMIN, "cv-1");
  });

  it("answers NOT_FOUND for a link that does not exist", async () => {
    prisma.cvSkill.findUnique.mockResolvedValue(null);

    expect(
      await rejection(service.update(USER, { id: "link-9", mastery: Mastery.EXPERT })),
    ).toBeInstanceOf(NotFoundException);
    expect(prisma.cvSkill.update).not.toHaveBeenCalled();
  });

  it("says in the message that the CV skill was not found", async () => {
    prisma.cvSkill.findUnique.mockResolvedValue(null);

    await expect(service.update(USER, { id: "link-9", mastery: Mastery.EXPERT })).rejects.toThrow(
      "CV skill not found",
    );
  });

  it("changes nothing when the CV of the link is not accessible", async () => {
    cvs.assertAccessible.mockRejectedValue(new NotFoundException("CV not found"));

    expect(
      await rejection(service.update(USER, { id: "link-1", mastery: Mastery.EXPERT })),
    ).toBeInstanceOf(NotFoundException);
    expect(prisma.cvSkill.update).not.toHaveBeenCalled();
  });

  it("turns a link that was deleted in between into NOT_FOUND", async () => {
    prisma.cvSkill.update.mockRejectedValue(databaseError("P2025"));

    expect(
      await rejection(service.update(USER, { id: "link-1", mastery: Mastery.EXPERT })),
    ).toBeInstanceOf(NotFoundException);
  });
});

describe("CvSkillsService.remove", () => {
  it("removes only links of the named CV", async () => {
    await service.remove(USER, { cvId: "cv-1", ids: ["link-1"] });

    expect(prisma.cvSkill.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ["link-1"] }, cvId: "cv-1" },
    });
  });

  it("deletes with the client of the transaction, not with the shared client", async () => {
    const tx = { cvSkill: { deleteMany: jest.fn().mockResolvedValue({ count: 1 }) } };
    transaction.mockImplementationOnce((work: (client: unknown) => Promise<unknown>) => work(tx));

    await service.remove(USER, { cvId: "cv-1", ids: ["link-1"] });

    expect(tx.cvSkill.deleteMany).toHaveBeenCalledTimes(1);
    expect(prisma.cvSkill.deleteMany).not.toHaveBeenCalled();
  });

  it("answers NOT_FOUND when one id is not in the CV", async () => {
    prisma.cvSkill.deleteMany.mockResolvedValue({ count: 1 });

    expect(
      await rejection(service.remove(USER, { cvId: "cv-1", ids: ["link-1", "link-2"] })),
    ).toBeInstanceOf(NotFoundException);
  });

  it("removes nothing when the CV is not accessible", async () => {
    cvs.assertAccessible.mockRejectedValue(new NotFoundException("CV not found"));

    expect(await rejection(service.remove(USER, { cvId: "cv-2", ids: ["link-1"] }))).toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.cvSkill.deleteMany).not.toHaveBeenCalled();
  });
});
