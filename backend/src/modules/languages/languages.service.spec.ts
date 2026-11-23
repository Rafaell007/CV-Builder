import { ConflictException, NotFoundException } from "@nestjs/common";
import { ValidationFailedException } from "../../common/errors";
import { PageInput, SortDirection } from "../../common/pagination";
import { Prisma } from "../../generated/prisma/client";
import type { PrismaService } from "../../prisma/prisma.service";
import { LanguagesService } from "./languages.service";
import { IsoCodeTakenException } from "./iso-code-taken.exception";

const ID = "6f1d3c52-8a0e-4f6c-9a43-2b7d5e1c9a10";
const INPUT = { name: "German", iso: "DE", nativeName: "Deutsch" };
const LANGUAGE = { id: ID, ...INPUT };
const SELECT = { id: true, name: true, iso: true, nativeName: true };

const prisma = {
  language: {
    findMany: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn(),
};

function createService(): LanguagesService {
  return new LanguagesService(prisma as unknown as PrismaService);
}

function databaseError(
  code: string,
  meta?: Record<string, unknown>,
): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError("database error", {
    code,
    clientVersion: "test",
    ...(meta && { meta }),
  });
}

/** A unique-constraint error as Prisma 7 with the pg adapter reports it. */
const duplicateOn = (index: string): Prisma.PrismaClientKnownRequestError =>
  databaseError("P2002", { driverAdapterError: { cause: { constraint: { index } } } });

const page = (): PageInput => new PageInput();

describe("LanguagesService", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    // A batch transaction: run the queries like Prisma does.
    prisma.$transaction.mockImplementation((queries: Promise<unknown>[]) => Promise.all(queries));
  });

  describe("list", () => {
    beforeEach(() => {
      prisma.language.findMany.mockResolvedValue([LANGUAGE]);
      prisma.language.count.mockResolvedValue(1);
    });

    it("returns the languages and the total", async () => {
      await expect(createService().list({ page: page() })).resolves.toEqual({
        items: [LANGUAGE],
        total: 1,
      });

      expect(prisma.language.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ select: SELECT }),
      );
    });

    it("sorts by name ascending when no sort is given, then by id", async () => {
      await createService().list({ page: page() });

      expect(prisma.language.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: [{ name: "asc" }, { id: "asc" }] }),
      );
    });

    it("sorts by ISO descending", async () => {
      await createService().list({
        page: page(),
        sort: { field: "iso", direction: SortDirection.DESC },
      });

      expect(prisma.language.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: [{ iso: "desc" }, { id: "asc" }] }),
      );
    });

    it("rejects a sort field that is not allowed", async () => {
      await expect(
        createService().list({
          page: page(),
          sort: { field: "nativeName", direction: SortDirection.ASC },
        }),
      ).rejects.toThrow(ValidationFailedException);
    });

    it("searches the name without regard to case, in the same query as the count", async () => {
      await createService().list({ search: "ger", page: page() });

      const where = { name: { contains: "ger", mode: "insensitive" } };
      expect(prisma.language.findMany).toHaveBeenCalledWith(expect.objectContaining({ where }));
      expect(prisma.language.count).toHaveBeenCalledWith({ where });
    });

    it("returns all languages for an empty search and skips the earlier pages", async () => {
      await createService().list({ search: "", page: { number: 2, size: 20 } });

      expect(prisma.language.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {}, skip: 20, take: 20 }),
      );
    });
  });

  describe("create", () => {
    it("saves the language and returns it", async () => {
      prisma.language.create.mockResolvedValue(LANGUAGE);

      await expect(createService().create(INPUT)).resolves.toEqual(LANGUAGE);

      expect(prisma.language.create).toHaveBeenCalledWith({ data: INPUT, select: SELECT });
    });

    it("fails with CONFLICT for a name that already exists", async () => {
      prisma.language.create.mockRejectedValue(duplicateOn("Language_name_key"));

      await expect(createService().create(INPUT)).rejects.toThrow(
        new ConflictException("Language already exists"),
      );
    });

    it("fails with CONFLICT for an ISO code that already exists", async () => {
      prisma.language.create.mockRejectedValue(duplicateOn("Language_iso_key"));

      await expect(createService().create(INPUT)).rejects.toThrow(IsoCodeTakenException);
      expect(prisma.language.findFirst).not.toHaveBeenCalled();
    });

    it("asks the database about the ISO code when the error does not name the index", async () => {
      prisma.language.create.mockRejectedValue(databaseError("P2002"));
      prisma.language.findFirst.mockResolvedValue({ id: ID });

      await expect(createService().create(INPUT)).rejects.toThrow(IsoCodeTakenException);
      expect(prisma.language.findFirst).toHaveBeenCalledWith({
        where: { iso: "DE" },
        select: { id: true },
      });
    });

    it("falls back to a name duplicate when the error does not name the index and the ISO code is free", async () => {
      prisma.language.create.mockRejectedValue(databaseError("P2002"));
      prisma.language.findFirst.mockResolvedValue(null);

      await expect(createService().create(INPUT)).rejects.toThrow(
        new ConflictException("Language already exists"),
      );
    });

    it("passes on other database errors", async () => {
      const error = databaseError("P1001");
      prisma.language.create.mockRejectedValue(error);

      await expect(createService().create(INPUT)).rejects.toBe(error);
    });
  });

  describe("update", () => {
    it("updates the language and returns it", async () => {
      prisma.language.update.mockResolvedValue(LANGUAGE);

      await expect(createService().update({ id: ID, ...INPUT })).resolves.toEqual(LANGUAGE);

      expect(prisma.language.update).toHaveBeenCalledWith({
        where: { id: ID },
        data: INPUT,
        select: SELECT,
      });
    });

    it("fails with CONFLICT for a name that already exists", async () => {
      prisma.language.update.mockRejectedValue(duplicateOn("Language_name_key"));

      await expect(createService().update({ id: ID, ...INPUT })).rejects.toThrow(
        new ConflictException("Language already exists"),
      );
    });

    it("fails with CONFLICT for an ISO code that already exists", async () => {
      prisma.language.update.mockRejectedValue(duplicateOn("Language_iso_key"));

      await expect(createService().update({ id: ID, ...INPUT })).rejects.toThrow(
        IsoCodeTakenException,
      );
    });

    it("asks the database about the ISO code of other languages when the error does not name the index", async () => {
      prisma.language.update.mockRejectedValue(databaseError("P2002"));
      prisma.language.findFirst.mockResolvedValue({ id: "another-id" });

      await expect(createService().update({ id: ID, ...INPUT })).rejects.toThrow(
        IsoCodeTakenException,
      );
      expect(prisma.language.findFirst).toHaveBeenCalledWith({
        where: { iso: "DE", id: { not: ID } },
        select: { id: true },
      });
    });

    it("fails with NOT_FOUND for an unknown language", async () => {
      prisma.language.update.mockRejectedValue(databaseError("P2025"));

      await expect(createService().update({ id: ID, ...INPUT })).rejects.toThrow(
        new NotFoundException("Language not found"),
      );
    });

    it("passes on other database errors", async () => {
      const error = databaseError("P1001");
      prisma.language.update.mockRejectedValue(error);

      await expect(createService().update({ id: ID, ...INPUT })).rejects.toBe(error);
    });
  });

  describe("delete", () => {
    it("deletes the language", async () => {
      prisma.language.delete.mockResolvedValue(LANGUAGE);

      await expect(createService().delete(ID)).resolves.toBeUndefined();

      expect(prisma.language.delete).toHaveBeenCalledWith({ where: { id: ID } });
    });

    it("fails with CONFLICT when a user still has the language", async () => {
      prisma.language.delete.mockRejectedValue(databaseError("P2003"));

      await expect(createService().delete(ID)).rejects.toThrow(
        new ConflictException("Language cannot be deleted because it is currently in use"),
      );
    });

    it("fails with NOT_FOUND for an unknown language", async () => {
      prisma.language.delete.mockRejectedValue(databaseError("P2025"));

      await expect(createService().delete(ID)).rejects.toThrow(
        new NotFoundException("Language not found"),
      );
    });

    it("passes on other database errors", async () => {
      const error = databaseError("P1001");
      prisma.language.delete.mockRejectedValue(error);

      await expect(createService().delete(ID)).rejects.toBe(error);
    });
  });
});
