import { ConflictException, NotFoundException } from "@nestjs/common";
import { ValidationFailedException } from "../../common/errors";
import { PageInput, SortDirection } from "../../common/pagination";
import { Prisma } from "../../generated/prisma/client";
import type { PrismaService } from "../../prisma/prisma.service";
import { SkillsService } from "./skills.service";

const ID = "6f1d3c52-8a0e-4f6c-9a43-2b7d5e1c9a10";
const CATEGORY_ID = "0b5e2f1a-3c4d-4e5f-8a9b-1c2d3e4f5a6b";
const CATEGORY = { id: CATEGORY_ID, name: "Frontend", type: "Programming technologies" };
const SKILL = { id: ID, name: "React", category: CATEGORY };
const SELECT = {
  id: true,
  name: true,
  category: { select: { id: true, name: true, type: true } },
};
const INPUT = { name: "React", categoryId: CATEGORY_ID };

const prisma = {
  skill: {
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  skillCategory: { findMany: jest.fn() },
  $transaction: jest.fn(),
};

function createService(): SkillsService {
  return new SkillsService(prisma as unknown as PrismaService);
}

function databaseError(code: string): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError("database error", {
    code,
    clientVersion: "test",
  });
}

const categoryNotFound = new ValidationFailedException([
  { field: "categoryId", messages: ["Category not found"] },
]);

const page = (): PageInput => new PageInput();

describe("SkillsService", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    // A batch transaction: run the queries like Prisma does.
    prisma.$transaction.mockImplementation((queries: Promise<unknown>[]) => Promise.all(queries));
  });

  describe("list", () => {
    it("lists every skill as id and name, by name", async () => {
      const skills = [{ id: ID, name: "React" }];
      prisma.skill.findMany.mockResolvedValue(skills);

      await expect(createService().list()).resolves.toBe(skills);

      expect(prisma.skill.findMany).toHaveBeenCalledWith({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      });
    });
  });

  describe("listPage", () => {
    beforeEach(() => {
      prisma.skill.findMany.mockResolvedValue([SKILL]);
      prisma.skill.count.mockResolvedValue(1);
    });

    it("returns the skills with their category and the total", async () => {
      await expect(createService().listPage({ page: page() })).resolves.toEqual({
        items: [SKILL],
        total: 1,
      });

      expect(prisma.skill.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ select: SELECT }),
      );
    });

    it("sorts by name ascending when no sort is given, then by id", async () => {
      await createService().listPage({ page: page() });

      expect(prisma.skill.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: [{ name: "asc" }, { id: "asc" }] }),
      );
    });

    it("sorts by name descending", async () => {
      await createService().listPage({
        page: page(),
        sort: { field: "name", direction: SortDirection.DESC },
      });

      expect(prisma.skill.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: [{ name: "desc" }, { id: "asc" }] }),
      );
    });

    it("rejects a sort field that is not allowed", async () => {
      await expect(
        createService().listPage({
          page: page(),
          sort: { field: "categoryId", direction: SortDirection.ASC },
        }),
      ).rejects.toThrow(ValidationFailedException);
    });

    it("searches the name without regard to case, in the same query as the count", async () => {
      await createService().listPage({ search: "rea", page: page() });

      const where = { name: { contains: "rea", mode: "insensitive" } };
      expect(prisma.skill.findMany).toHaveBeenCalledWith(expect.objectContaining({ where }));
      expect(prisma.skill.count).toHaveBeenCalledWith({ where });
    });

    it("returns all skills for an empty search and skips the earlier pages", async () => {
      await createService().listPage({ search: "", page: { number: 3, size: 10 } });

      expect(prisma.skill.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {}, skip: 20, take: 10 }),
      );
    });
  });

  describe("listCategories", () => {
    it("lists every category with its type, by name", async () => {
      prisma.skillCategory.findMany.mockResolvedValue([CATEGORY]);

      await expect(createService().listCategories()).resolves.toEqual([CATEGORY]);

      expect(prisma.skillCategory.findMany).toHaveBeenCalledWith({
        select: { id: true, name: true, type: true },
        orderBy: { name: "asc" },
      });
    });
  });

  describe("create", () => {
    it("saves the skill and returns it with its category", async () => {
      prisma.skill.create.mockResolvedValue(SKILL);

      await expect(createService().create(INPUT)).resolves.toEqual(SKILL);

      expect(prisma.skill.create).toHaveBeenCalledWith({ data: INPUT, select: SELECT });
    });

    it("fails with CONFLICT for a name that already exists", async () => {
      prisma.skill.create.mockRejectedValue(databaseError("P2002"));

      await expect(createService().create(INPUT)).rejects.toThrow(
        new ConflictException("Skill already exists"),
      );
    });

    it("fails with a field error on categoryId for an unknown category", async () => {
      prisma.skill.create.mockRejectedValue(databaseError("P2003"));

      await expect(createService().create(INPUT)).rejects.toEqual(categoryNotFound);
    });

    it("passes on other database errors", async () => {
      const error = databaseError("P1001");
      prisma.skill.create.mockRejectedValue(error);

      await expect(createService().create(INPUT)).rejects.toBe(error);
    });
  });

  describe("update", () => {
    it("changes the name and the category and returns the skill", async () => {
      prisma.skill.update.mockResolvedValue(SKILL);

      await expect(createService().update({ id: ID, ...INPUT })).resolves.toEqual(SKILL);

      expect(prisma.skill.update).toHaveBeenCalledWith({
        where: { id: ID },
        data: INPUT,
        select: SELECT,
      });
    });

    it("fails with CONFLICT for a name that already exists", async () => {
      prisma.skill.update.mockRejectedValue(databaseError("P2002"));

      await expect(createService().update({ id: ID, ...INPUT })).rejects.toThrow(
        new ConflictException("Skill already exists"),
      );
    });

    it("fails with a field error on categoryId for an unknown category", async () => {
      prisma.skill.update.mockRejectedValue(databaseError("P2003"));

      await expect(createService().update({ id: ID, ...INPUT })).rejects.toEqual(categoryNotFound);
    });

    it("fails with NOT_FOUND for an unknown skill", async () => {
      prisma.skill.update.mockRejectedValue(databaseError("P2025"));

      await expect(createService().update({ id: ID, ...INPUT })).rejects.toThrow(
        new NotFoundException("Skill not found"),
      );
    });

    it("passes on other database errors", async () => {
      const error = databaseError("P1001");
      prisma.skill.update.mockRejectedValue(error);

      await expect(createService().update({ id: ID, ...INPUT })).rejects.toBe(error);
    });
  });

  describe("delete", () => {
    it("deletes the skill", async () => {
      prisma.skill.delete.mockResolvedValue(SKILL);

      await expect(createService().delete(ID)).resolves.toBeUndefined();

      expect(prisma.skill.delete).toHaveBeenCalledWith({ where: { id: ID } });
    });

    it("fails with CONFLICT when a user, a CV or a project still uses the skill", async () => {
      prisma.skill.delete.mockRejectedValue(databaseError("P2003"));

      await expect(createService().delete(ID)).rejects.toThrow(
        new ConflictException("Skill cannot be deleted because it is currently in use"),
      );
    });

    it("fails with NOT_FOUND for an unknown skill", async () => {
      prisma.skill.delete.mockRejectedValue(databaseError("P2025"));

      await expect(createService().delete(ID)).rejects.toThrow(
        new NotFoundException("Skill not found"),
      );
    });

    it("passes on other database errors", async () => {
      const error = databaseError("P1001");
      prisma.skill.delete.mockRejectedValue(error);

      await expect(createService().delete(ID)).rejects.toBe(error);
    });
  });
});
