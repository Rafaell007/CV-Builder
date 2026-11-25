import { ConflictException, NotFoundException } from "@nestjs/common";
import { ValidationFailedException } from "../../common/errors";
import { PageInput, SortDirection } from "../../common/pagination";
import { Prisma } from "../../generated/prisma/client";
import type { PrismaService } from "../../prisma/prisma.service";
import { DepartmentsService } from "./departments.service";

const ID = "6f1d3c52-8a0e-4f6c-9a43-2b7d5e1c9a10";
const DEPARTMENT = { id: ID, name: "Engineering" };
const SELECT = { id: true, name: true };

const prisma = {
  department: {
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn(),
};

function createService(): DepartmentsService {
  return new DepartmentsService(prisma as unknown as PrismaService);
}

function databaseError(code: string): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError("database error", {
    code,
    clientVersion: "test",
  });
}

const page = (): PageInput => new PageInput();

describe("DepartmentsService", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    // A batch transaction: run the queries like Prisma does.
    prisma.$transaction.mockImplementation((queries: Promise<unknown>[]) => Promise.all(queries));
  });

  describe("list", () => {
    beforeEach(() => {
      prisma.department.findMany.mockResolvedValue([DEPARTMENT]);
      prisma.department.count.mockResolvedValue(1);
    });

    it("returns the departments and the total", async () => {
      await expect(createService().list({ page: page() })).resolves.toEqual({
        items: [DEPARTMENT],
        total: 1,
      });

      expect(prisma.department.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ select: SELECT }),
      );
    });

    it("sorts by name ascending when no sort is given, then by id", async () => {
      await createService().list({ page: page() });

      expect(prisma.department.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: [{ name: "asc" }, { id: "asc" }] }),
      );
    });

    it("sorts by name descending", async () => {
      await createService().list({
        page: page(),
        sort: { field: "name", direction: SortDirection.DESC },
      });

      expect(prisma.department.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: [{ name: "desc" }, { id: "asc" }] }),
      );
    });

    it("rejects a sort field that is not allowed", async () => {
      await expect(
        createService().list({ page: page(), sort: { field: "id", direction: SortDirection.ASC } }),
      ).rejects.toThrow(ValidationFailedException);
    });

    it("searches the name without regard to case, in the same query as the count", async () => {
      await createService().list({ search: "eng", page: page() });

      const where = { name: { contains: "eng", mode: "insensitive" } };
      expect(prisma.department.findMany).toHaveBeenCalledWith(expect.objectContaining({ where }));
      expect(prisma.department.count).toHaveBeenCalledWith({ where });
    });

    it("returns all departments for an empty search and skips the earlier pages", async () => {
      await createService().list({ search: "", page: { number: 3, size: 10 } });

      expect(prisma.department.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {}, skip: 20, take: 10 }),
      );
    });
  });

  describe("listOptions", () => {
    it("returns every department, sorted by name, then by id, without pages", async () => {
      prisma.department.findMany.mockResolvedValue([DEPARTMENT]);

      await expect(createService().listOptions()).resolves.toEqual([DEPARTMENT]);

      expect(prisma.department.findMany).toHaveBeenCalledWith({
        select: SELECT,
        orderBy: [{ name: "asc" }, { id: "asc" }],
      });
    });
  });

  describe("create", () => {
    it("saves the department and returns it", async () => {
      prisma.department.create.mockResolvedValue(DEPARTMENT);

      await expect(createService().create({ name: "Engineering" })).resolves.toEqual(DEPARTMENT);

      expect(prisma.department.create).toHaveBeenCalledWith({
        data: { name: "Engineering" },
        select: SELECT,
      });
    });

    it("fails with CONFLICT for a name that already exists", async () => {
      prisma.department.create.mockRejectedValue(databaseError("P2002"));

      await expect(createService().create({ name: "Engineering" })).rejects.toThrow(
        new ConflictException("Department already exists"),
      );
    });

    it("passes on other database errors", async () => {
      const error = databaseError("P1001");
      prisma.department.create.mockRejectedValue(error);

      await expect(createService().create({ name: "Engineering" })).rejects.toBe(error);
    });
  });

  describe("update", () => {
    it("renames the department and returns it", async () => {
      prisma.department.update.mockResolvedValue(DEPARTMENT);

      await expect(createService().update({ id: ID, name: "Engineering" })).resolves.toEqual(
        DEPARTMENT,
      );

      expect(prisma.department.update).toHaveBeenCalledWith({
        where: { id: ID },
        data: { name: "Engineering" },
        select: SELECT,
      });
    });

    it("fails with CONFLICT for a name that already exists", async () => {
      prisma.department.update.mockRejectedValue(databaseError("P2002"));

      await expect(createService().update({ id: ID, name: "Sales" })).rejects.toThrow(
        new ConflictException("Department already exists"),
      );
    });

    it("fails with NOT_FOUND for an unknown department", async () => {
      prisma.department.update.mockRejectedValue(databaseError("P2025"));

      await expect(createService().update({ id: ID, name: "Sales" })).rejects.toThrow(
        new NotFoundException("Department not found"),
      );
    });

    it("passes on other database errors", async () => {
      const error = databaseError("P1001");
      prisma.department.update.mockRejectedValue(error);

      await expect(createService().update({ id: ID, name: "Sales" })).rejects.toBe(error);
    });
  });

  describe("delete", () => {
    it("deletes the department", async () => {
      prisma.department.delete.mockResolvedValue(DEPARTMENT);

      await expect(createService().delete(ID)).resolves.toBeUndefined();

      expect(prisma.department.delete).toHaveBeenCalledWith({ where: { id: ID } });
    });

    it("fails with CONFLICT when users still have the department", async () => {
      prisma.department.delete.mockRejectedValue(databaseError("P2003"));

      await expect(createService().delete(ID)).rejects.toThrow(
        new ConflictException("Department cannot be deleted because it is currently in use"),
      );
    });

    it("fails with NOT_FOUND for an unknown department", async () => {
      prisma.department.delete.mockRejectedValue(databaseError("P2025"));

      await expect(createService().delete(ID)).rejects.toThrow(
        new NotFoundException("Department not found"),
      );
    });

    it("passes on other database errors", async () => {
      const error = databaseError("P1001");
      prisma.department.delete.mockRejectedValue(error);

      await expect(createService().delete(ID)).rejects.toBe(error);
    });
  });
});
