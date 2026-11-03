import { ConflictException, NotFoundException } from "@nestjs/common";
import { ValidationFailedException } from "../../common/errors";
import { PageInput, SortDirection } from "../../common/pagination";
import { Prisma } from "../../generated/prisma/client";
import type { PrismaService } from "../../prisma/prisma.service";
import type { CreateProjectInput } from "./dto/create-project.input";
import type { UpdateProjectInput } from "./dto/update-project.input";
import { ProjectsService } from "./projects.service";

const ID = "6f1d3c52-8a0e-4f6c-9a43-2b7d5e1c9a10";
const SKILL_ID = "0b9c6f0e-6d1a-4f0e-8a55-5f2f0c4d7b11";

const START = new Date("2026-01-01T00:00:00.000Z");
const END = new Date("2026-06-30T00:00:00.000Z");

const ROW = {
  id: ID,
  name: "Intranet",
  domain: "Banking",
  startDate: START,
  endDate: END,
  description: "A portal",
  createdAt: START,
  updatedAt: START,
  skills: [{ skill: { id: SKILL_ID, name: "TypeScript" } }],
};

const prisma = {
  project: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  skill: { count: jest.fn() },
  cvProject: { count: jest.fn() },
  $transaction: jest.fn((operations: Promise<unknown>[]) => Promise.all(operations)),
};

function createService(): ProjectsService {
  return new ProjectsService(prisma as unknown as PrismaService);
}

function createInput(overrides: Partial<CreateProjectInput> = {}): CreateProjectInput {
  return {
    name: "Intranet",
    domain: "Banking",
    startDate: START,
    endDate: END,
    description: "A portal",
    environmentIds: [SKILL_ID],
    ...overrides,
  };
}

const page = (): PageInput => new PageInput();

describe("ProjectsService", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    prisma.$transaction.mockImplementation((operations: Promise<unknown>[]) =>
      Promise.all(operations),
    );
  });

  describe("list", () => {
    beforeEach(() => {
      prisma.project.findMany.mockResolvedValue([ROW]);
      prisma.project.count.mockResolvedValue(1);
    });

    it("returns the projects with their environment as skill tags, and the total", async () => {
      await expect(createService().list({ page: page() })).resolves.toEqual({
        items: [
          {
            id: ID,
            name: "Intranet",
            domain: "Banking",
            startDate: START,
            endDate: END,
            description: "A portal",
            createdAt: START,
            updatedAt: START,
            environment: [{ id: SKILL_ID, name: "TypeScript" }],
          },
        ],
        total: 1,
      });
    });

    it("sorts by name ascending when no sort is given, then by id", async () => {
      await createService().list({ page: page() });

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: [{ name: "asc" }, { id: "asc" }] }),
      );
    });

    it.each(["name", "startDate", "endDate"])("sorts by %s in both directions", async (field) => {
      await createService().list({ page: page(), sort: { field, direction: SortDirection.DESC } });
      await createService().list({ page: page(), sort: { field, direction: SortDirection.ASC } });

      expect(prisma.project.findMany).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ orderBy: [{ [field]: "desc" }, { id: "asc" }] }),
      );
      expect(prisma.project.findMany).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ orderBy: [{ [field]: "asc" }, { id: "asc" }] }),
      );
    });

    it("rejects a sort field that is not allowed", async () => {
      await expect(
        createService().list({
          page: page(),
          sort: { field: "description", direction: SortDirection.ASC },
        }),
      ).rejects.toThrow(ValidationFailedException);
    });

    it("searches name and domain without regard to case, in the same query as the count", async () => {
      await createService().list({ search: "bank", page: page() });

      const where = {
        OR: [
          { name: { contains: "bank", mode: "insensitive" } },
          { domain: { contains: "bank", mode: "insensitive" } },
        ],
      };
      expect(prisma.project.findMany).toHaveBeenCalledWith(expect.objectContaining({ where }));
      expect(prisma.project.count).toHaveBeenCalledWith({ where });
    });

    it("returns all projects for an empty search and skips the earlier pages", async () => {
      await createService().list({ search: "", page: { number: 3, size: 10 } });

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {}, skip: 20, take: 10 }),
      );
    });
  });

  describe("create", () => {
    beforeEach(() => {
      prisma.skill.count.mockResolvedValue(1);
      prisma.project.create.mockResolvedValue(ROW);
    });

    it("saves the project with its environment and returns it", async () => {
      const project = await createService().create(createInput());

      expect(prisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            name: "Intranet",
            domain: "Banking",
            description: "A portal",
            startDate: START,
            endDate: END,
            skills: { create: [{ skillId: SKILL_ID }] },
          },
        }),
      );
      expect(project.environment).toEqual([{ id: SKILL_ID, name: "TypeScript" }]);
    });

    it("stores whole days", async () => {
      await createService().create(
        createInput({
          startDate: new Date("2026-01-01T15:00:00Z"),
          endDate: new Date("2026-06-30T01:00:00Z"),
        }),
      );

      expect(prisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ startDate: START, endDate: END }),
        }),
      );
    });

    it("rejects an end date before the start date and saves nothing", async () => {
      await expect(
        createService().create(createInput({ startDate: END, endDate: START })),
      ).rejects.toThrow(ValidationFailedException);

      expect(prisma.project.create).not.toHaveBeenCalled();
    });

    it("rejects a skill that does not exist and saves nothing", async () => {
      prisma.skill.count.mockResolvedValue(0);

      await expect(createService().create(createInput())).rejects.toThrow(
        ValidationFailedException,
      );

      expect(prisma.skill.count).toHaveBeenCalledWith({ where: { id: { in: [SKILL_ID] } } });
      expect(prisma.project.create).not.toHaveBeenCalled();
    });

    it("does not look up skills for an empty environment", async () => {
      await createService().create(createInput({ environmentIds: [] }));

      expect(prisma.skill.count).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    const input = (overrides: Partial<UpdateProjectInput> = {}): UpdateProjectInput =>
      ({ ...createInput(), id: ID, ...overrides }) as UpdateProjectInput;

    beforeEach(() => {
      prisma.project.findUnique.mockResolvedValue({ startDate: START, endDate: END });
      prisma.skill.count.mockResolvedValue(1);
      prisma.cvProject.count.mockResolvedValue(0);
      prisma.project.update.mockResolvedValue(ROW);
    });

    it("replaces the fields and the whole environment", async () => {
      await createService().update(input({ name: "Intranet 2" }));

      expect(prisma.project.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: ID },
          data: expect.objectContaining({
            name: "Intranet 2",
            skills: { deleteMany: {}, create: [{ skillId: SKILL_ID }] },
          }),
        }),
      );
    });

    it("fails with NOT_FOUND for an unknown project", async () => {
      prisma.project.findUnique.mockResolvedValue(null);

      await expect(createService().update(input())).rejects.toThrow(NotFoundException);

      expect(prisma.project.update).not.toHaveBeenCalled();
    });

    it("rejects an end date before the start date", async () => {
      await expect(
        createService().update(input({ startDate: END, endDate: START })),
      ).rejects.toThrow(ValidationFailedException);
    });

    it("rejects a skill that does not exist", async () => {
      prisma.skill.count.mockResolvedValue(0);

      await expect(createService().update(input())).rejects.toThrow(ValidationFailedException);
    });

    it("does not check the CVs when the dates stay the same", async () => {
      await createService().update(input());

      expect(prisma.cvProject.count).not.toHaveBeenCalled();
    });

    it("counts the CV entries outside the new dates (D25)", async () => {
      const newStart = new Date("2026-02-01T00:00:00.000Z");

      await createService().update(input({ startDate: newStart }));

      expect(prisma.cvProject.count).toHaveBeenCalledWith({
        where: {
          projectId: ID,
          OR: [
            { startDate: { lt: newStart } },
            { startDate: { gt: END } },
            { endDate: { lt: newStart } },
            { endDate: { gt: END } },
          ],
        },
      });
    });

    it("fails with CONFLICT and the count when CV entries would fall outside the new dates", async () => {
      prisma.cvProject.count.mockResolvedValue(2);

      const attempt = createService().update(input({ endDate: new Date("2026-03-01") }));

      await expect(attempt).rejects.toThrow(ConflictException);
      await expect(attempt).rejects.toThrow("2 CVs");
      expect(prisma.project.update).not.toHaveBeenCalled();
    });

    it("uses the singular for one CV", async () => {
      prisma.cvProject.count.mockResolvedValue(1);

      await expect(
        createService().update(input({ endDate: new Date("2026-03-01") })),
      ).rejects.toThrow("1 CV");
    });
  });

  describe("delete", () => {
    it("deletes a project that no CV uses", async () => {
      prisma.project.findUnique.mockResolvedValue({ _count: { cvProjects: 0 } });

      await createService().delete(ID);

      expect(prisma.project.delete).toHaveBeenCalledWith({ where: { id: ID } });
    });

    it("fails with NOT_FOUND for an unknown project", async () => {
      prisma.project.findUnique.mockResolvedValue(null);

      await expect(createService().delete(ID)).rejects.toThrow(NotFoundException);
    });

    it("fails with CONFLICT and the count when a CV uses the project (D18)", async () => {
      prisma.project.findUnique.mockResolvedValue({ _count: { cvProjects: 3 } });

      const attempt = createService().delete(ID);

      await expect(attempt).rejects.toThrow(ConflictException);
      await expect(attempt).rejects.toThrow("3 CVs");
      expect(prisma.project.delete).not.toHaveBeenCalled();
    });

    it("turns a foreign key error from a parallel request into CONFLICT", async () => {
      prisma.project.findUnique.mockResolvedValue({ _count: { cvProjects: 0 } });
      prisma.project.delete.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError("foreign key", {
          code: "P2003",
          clientVersion: "7",
        }),
      );

      await expect(createService().delete(ID)).rejects.toThrow(ConflictException);
    });

    it("passes other database errors on", async () => {
      prisma.project.findUnique.mockResolvedValue({ _count: { cvProjects: 0 } });
      prisma.project.delete.mockRejectedValue(new Error("connection lost"));

      await expect(createService().delete(ID)).rejects.toThrow("connection lost");
    });
  });
});
