import { ConflictException, NotFoundException } from "@nestjs/common";
import { ValidationFailedException } from "../../common/errors";
import { PageInput, SortDirection } from "../../common/pagination";
import { Prisma } from "../../generated/prisma/client";
import type { PrismaService } from "../../prisma/prisma.service";
import { PositionsService } from "./positions.service";

const ID = "6f1d3c52-8a0e-4f6c-9a43-2b7d5e1c9a10";
const POSITION = { id: ID, name: "Developer" };
const SELECT = { id: true, name: true };

const prisma = {
  position: {
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn(),
};

function createService(): PositionsService {
  return new PositionsService(prisma as unknown as PrismaService);
}

function databaseError(code: string): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError("database error", {
    code,
    clientVersion: "test",
  });
}

const page = (): PageInput => new PageInput();

describe("PositionsService", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    // A batch transaction: run the queries like Prisma does.
    prisma.$transaction.mockImplementation((queries: Promise<unknown>[]) => Promise.all(queries));
  });

  describe("list", () => {
    beforeEach(() => {
      prisma.position.findMany.mockResolvedValue([POSITION]);
      prisma.position.count.mockResolvedValue(1);
    });

    it("returns the positions and the total", async () => {
      await expect(createService().list({ page: page() })).resolves.toEqual({
        items: [POSITION],
        total: 1,
      });

      expect(prisma.position.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ select: SELECT }),
      );
    });

    it("sorts by name ascending when no sort is given, then by id", async () => {
      await createService().list({ page: page() });

      expect(prisma.position.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: [{ name: "asc" }, { id: "asc" }] }),
      );
    });

    it("sorts by name descending", async () => {
      await createService().list({
        page: page(),
        sort: { field: "name", direction: SortDirection.DESC },
      });

      expect(prisma.position.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: [{ name: "desc" }, { id: "asc" }] }),
      );
    });

    it("rejects a sort field that is not allowed", async () => {
      await expect(
        createService().list({ page: page(), sort: { field: "id", direction: SortDirection.ASC } }),
      ).rejects.toThrow(ValidationFailedException);
    });

    it("searches the name without regard to case, in the same query as the count", async () => {
      await createService().list({ search: "dev", page: page() });

      const where = { name: { contains: "dev", mode: "insensitive" } };
      expect(prisma.position.findMany).toHaveBeenCalledWith(expect.objectContaining({ where }));
      expect(prisma.position.count).toHaveBeenCalledWith({ where });
    });

    it("returns all positions for an empty search and skips the earlier pages", async () => {
      await createService().list({ search: "", page: { number: 3, size: 10 } });

      expect(prisma.position.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {}, skip: 20, take: 10 }),
      );
    });
  });

  describe("create", () => {
    it("saves the position and returns it", async () => {
      prisma.position.create.mockResolvedValue(POSITION);

      await expect(createService().create({ name: "Developer" })).resolves.toEqual(POSITION);

      expect(prisma.position.create).toHaveBeenCalledWith({
        data: { name: "Developer" },
        select: SELECT,
      });
    });

    it("fails with CONFLICT for a name that already exists", async () => {
      prisma.position.create.mockRejectedValue(databaseError("P2002"));

      await expect(createService().create({ name: "Developer" })).rejects.toThrow(
        new ConflictException("Position already exists"),
      );
    });

    it("passes on other database errors", async () => {
      const error = databaseError("P1001");
      prisma.position.create.mockRejectedValue(error);

      await expect(createService().create({ name: "Developer" })).rejects.toBe(error);
    });
  });

  describe("update", () => {
    it("renames the position and returns it", async () => {
      prisma.position.update.mockResolvedValue(POSITION);

      await expect(createService().update({ id: ID, name: "Developer" })).resolves.toEqual(
        POSITION,
      );

      expect(prisma.position.update).toHaveBeenCalledWith({
        where: { id: ID },
        data: { name: "Developer" },
        select: SELECT,
      });
    });

    it("fails with CONFLICT for a name that already exists", async () => {
      prisma.position.update.mockRejectedValue(databaseError("P2002"));

      await expect(createService().update({ id: ID, name: "Tester" })).rejects.toThrow(
        new ConflictException("Position already exists"),
      );
    });

    it("fails with NOT_FOUND for an unknown position", async () => {
      prisma.position.update.mockRejectedValue(databaseError("P2025"));

      await expect(createService().update({ id: ID, name: "Tester" })).rejects.toThrow(
        new NotFoundException("Position not found"),
      );
    });

    it("passes on other database errors", async () => {
      const error = databaseError("P1001");
      prisma.position.update.mockRejectedValue(error);

      await expect(createService().update({ id: ID, name: "Tester" })).rejects.toBe(error);
    });
  });

  describe("delete", () => {
    it("deletes the position", async () => {
      prisma.position.delete.mockResolvedValue(POSITION);

      await expect(createService().delete(ID)).resolves.toBeUndefined();

      expect(prisma.position.delete).toHaveBeenCalledWith({ where: { id: ID } });
    });

    it("fails with CONFLICT when users still have the position", async () => {
      prisma.position.delete.mockRejectedValue(databaseError("P2003"));

      await expect(createService().delete(ID)).rejects.toThrow(
        new ConflictException("Position cannot be deleted because it is currently in use"),
      );
    });

    it("fails with NOT_FOUND for an unknown position", async () => {
      prisma.position.delete.mockRejectedValue(databaseError("P2025"));

      await expect(createService().delete(ID)).rejects.toThrow(
        new NotFoundException("Position not found"),
      );
    });

    it("passes on other database errors", async () => {
      const error = databaseError("P1001");
      prisma.position.delete.mockRejectedValue(error);

      await expect(createService().delete(ID)).rejects.toBe(error);
    });
  });
});
