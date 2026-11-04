import { ForbiddenException, NotFoundException } from "@nestjs/common";
import type { AuthUser } from "../../common/auth";
import { PageInput, SortDirection } from "../../common/pagination";
import { Role } from "../../generated/prisma/enums";
import type { PrismaService } from "../../prisma/prisma.service";
import { CvsService } from "./cvs.service";
import type { CvsArgs } from "./dto/cvs.args";

const USER: AuthUser = { id: "user-1", role: Role.USER, isVerified: true };
const ADMIN: AuthUser = { id: "admin-1", role: Role.ADMIN, isVerified: true };

const prisma = {
  cv: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  user: { findUnique: jest.fn() },
  $transaction: jest.fn((queries: Promise<unknown>[]) => Promise.all(queries)),
};

function storedCv(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "cv-1",
    name: "Backend CV",
    education: "MSc",
    description: "Text",
    userId: USER.id,
    createdAt: new Date("2026-11-01T10:00:00.000Z"),
    updatedAt: new Date("2026-11-01T10:00:00.000Z"),
    user: { email: "user1@example.com" },
    ...overrides,
  };
}

function args(overrides: Partial<CvsArgs> = {}): CvsArgs {
  return { page: new PageInput(), ...overrides } as CvsArgs;
}

function whereOfList(): unknown {
  const call = prisma.cv.findMany.mock.calls[0] as [{ where: unknown }];
  return call[0].where;
}

async function rejection(call: Promise<unknown>): Promise<unknown> {
  try {
    await call;
  } catch (error) {
    return error;
  }
  throw new Error("The call did not fail");
}

/** What Prisma throws when update or delete finds no record. */
function missingRecordError(): Error {
  return Object.assign(new Error("Record not found"), { code: "P2025" });
}

const service = new CvsService(prisma as unknown as PrismaService);

beforeEach(() => {
  jest.clearAllMocks();
  prisma.cv.findMany.mockResolvedValue([storedCv()]);
  prisma.cv.count.mockResolvedValue(1);
});

describe("CvsService.list", () => {
  it("returns the owner email and the total", async () => {
    const result = await service.list(USER, args());

    expect(result.total).toBe(1);
    expect(result.items[0]).toMatchObject({ id: "cv-1", ownerEmail: "user1@example.com" });
    expect(result.items[0]).not.toHaveProperty("user");
  });

  it("limits a user to their own CVs", async () => {
    await service.list(USER, args());

    expect(whereOfList()).toEqual({ userId: USER.id });
  });

  it("rejects a user who asks for the CVs of another user", async () => {
    const error = await rejection(service.list(USER, args({ userId: "user-2" })));

    expect(error).toBeInstanceOf(ForbiddenException);
    expect(prisma.cv.findMany).not.toHaveBeenCalled();
  });

  it("lets a user name their own id", async () => {
    await service.list(USER, args({ userId: USER.id }));

    expect(whereOfList()).toEqual({ userId: USER.id });
  });

  it("shows all CVs to an admin", async () => {
    await service.list(ADMIN, args());

    expect(whereOfList()).toEqual({});
  });

  it("lets an admin filter by user", async () => {
    await service.list(ADMIN, args({ userId: "user-2" }));

    expect(whereOfList()).toEqual({ userId: "user-2" });
  });

  it("searches the name only for a user, case-insensitive, inside their own CVs", async () => {
    await service.list(USER, args({ search: "back" }));

    expect(whereOfList()).toEqual({
      userId: USER.id,
      OR: [{ name: { contains: "back", mode: "insensitive" } }],
    });
  });

  it("searches the name and the owner email for an admin", async () => {
    await service.list(ADMIN, args({ search: "ada" }));

    expect(whereOfList()).toEqual({
      OR: [
        { name: { contains: "ada", mode: "insensitive" } },
        { user: { email: { contains: "ada", mode: "insensitive" } } },
      ],
    });
  });

  it("sorts by name with a stable tie-breaker and counts the same rows", async () => {
    await service.list(
      USER,
      args({ sort: { field: "name", direction: SortDirection.DESC }, search: "x" }),
    );

    const call = prisma.cv.findMany.mock.calls[0] as [{ orderBy: unknown }];
    expect(call[0].orderBy).toEqual([{ name: "desc" }, { id: "asc" }]);
    expect(prisma.cv.count).toHaveBeenCalledWith({ where: whereOfList() });
  });

  it("sorts by name ascending by default", async () => {
    await service.list(USER, args());

    const call = prisma.cv.findMany.mock.calls[0] as [{ orderBy: unknown }];
    expect(call[0].orderBy).toEqual([{ name: "asc" }, { id: "asc" }]);
  });

  it("rejects a sort field that is not allowed", async () => {
    await expect(
      service.list(USER, args({ sort: { field: "userId", direction: SortDirection.ASC } })),
    ).rejects.toThrow();

    expect(prisma.cv.findMany).not.toHaveBeenCalled();
  });

  it("applies the page as skip and take", async () => {
    const page = new PageInput();
    page.number = 3;
    page.size = 10;

    await service.list(USER, args({ page }));

    expect(prisma.cv.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 10 }),
    );
  });
});

describe("CvsService.get", () => {
  it("returns an own CV", async () => {
    prisma.cv.findUnique.mockResolvedValue(storedCv());

    await expect(service.get(USER, "cv-1")).resolves.toMatchObject({ id: "cv-1" });
  });

  it("returns the CV of another user to an admin", async () => {
    prisma.cv.findUnique.mockResolvedValue(storedCv({ userId: "user-2" }));

    await expect(service.get(ADMIN, "cv-1")).resolves.toMatchObject({ id: "cv-1" });
  });

  it("answers NOT_FOUND for the CV of another user", async () => {
    prisma.cv.findUnique.mockResolvedValue(storedCv({ userId: "user-2" }));

    expect(await rejection(service.get(USER, "cv-1"))).toBeInstanceOf(NotFoundException);
  });

  it("answers NOT_FOUND for a missing CV", async () => {
    prisma.cv.findUnique.mockResolvedValue(null);

    expect(await rejection(service.get(ADMIN, "cv-1"))).toBeInstanceOf(NotFoundException);
  });
});

describe("CvsService.assertAccessible", () => {
  it("passes for an own CV", async () => {
    prisma.cv.findUnique.mockResolvedValue(storedCv());

    await expect(service.assertAccessible(USER, "cv-1")).resolves.toBeUndefined();
  });

  it("passes for an admin on the CV of another user", async () => {
    prisma.cv.findUnique.mockResolvedValue(storedCv({ userId: "user-2" }));

    await expect(service.assertAccessible(ADMIN, "cv-1")).resolves.toBeUndefined();
  });

  it("answers NOT_FOUND for the CV of another user", async () => {
    prisma.cv.findUnique.mockResolvedValue(storedCv({ userId: "user-2" }));

    expect(await rejection(service.assertAccessible(USER, "cv-1"))).toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe("CvsService.create", () => {
  const input = { name: "New", education: "BSc", description: "Text" };

  beforeEach(() => {
    prisma.cv.create.mockResolvedValue(storedCv({ name: "New" }));
  });

  it("makes the signed-in user the owner", async () => {
    await service.create(USER, input);

    expect(prisma.cv.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: { ...input, userId: USER.id } }),
    );
  });

  it("rejects a user who names another owner", async () => {
    const error = await rejection(service.create(USER, { ...input, userId: "user-2" }));

    expect(error).toBeInstanceOf(ForbiddenException);
    expect(prisma.cv.create).not.toHaveBeenCalled();
  });

  it("lets an admin create a CV for another user", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: "user-2" });

    await service.create(ADMIN, { ...input, userId: "user-2" });

    expect(prisma.cv.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: { ...input, userId: "user-2" } }),
    );
  });

  it("makes the admin the owner when no user is named", async () => {
    await service.create(ADMIN, input);

    expect(prisma.cv.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: { ...input, userId: ADMIN.id } }),
    );
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("reports a field error when the named owner does not exist", async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.create(ADMIN, { ...input, userId: "missing" })).rejects.toMatchObject({
      fieldErrors: [{ field: "userId", messages: ["User not found"] }],
    });
    expect(prisma.cv.create).not.toHaveBeenCalled();
  });
});

describe("CvsService.update", () => {
  const input = { id: "cv-1", name: "Changed", education: "PhD", description: "New" };

  it("updates an own CV without changing the owner", async () => {
    prisma.cv.findUnique.mockResolvedValue(storedCv());
    prisma.cv.update.mockResolvedValue(storedCv({ name: "Changed" }));

    await expect(service.update(USER, input)).resolves.toMatchObject({ name: "Changed" });

    expect(prisma.cv.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "cv-1" },
        data: { name: "Changed", education: "PhD", description: "New" },
      }),
    );
  });

  it("lets an admin update the CV of another user", async () => {
    prisma.cv.findUnique.mockResolvedValue(storedCv({ userId: "user-2" }));
    prisma.cv.update.mockResolvedValue(storedCv({ userId: "user-2" }));

    await service.update(ADMIN, input);

    expect(prisma.cv.update).toHaveBeenCalled();
  });

  it("does not change the CV of another user", async () => {
    prisma.cv.findUnique.mockResolvedValue(storedCv({ userId: "user-2" }));

    expect(await rejection(service.update(USER, input))).toBeInstanceOf(NotFoundException);
    expect(prisma.cv.update).not.toHaveBeenCalled();
  });

  it("answers NOT_FOUND when the CV is deleted after the access check", async () => {
    prisma.cv.findUnique.mockResolvedValue(storedCv());
    prisma.cv.update.mockRejectedValue(missingRecordError());

    expect(await rejection(service.update(USER, input))).toBeInstanceOf(NotFoundException);
  });
});

describe("CvsService.delete", () => {
  it("deletes an own CV and returns it", async () => {
    prisma.cv.findUnique.mockResolvedValue(storedCv());
    prisma.cv.delete.mockResolvedValue(storedCv());

    await expect(service.delete(USER, "cv-1")).resolves.toMatchObject({ id: "cv-1" });

    expect(prisma.cv.delete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "cv-1" } }),
    );
  });

  it("lets an admin delete the CV of another user", async () => {
    prisma.cv.findUnique.mockResolvedValue(storedCv({ userId: "user-2" }));
    prisma.cv.delete.mockResolvedValue(storedCv({ userId: "user-2" }));

    await service.delete(ADMIN, "cv-1");

    expect(prisma.cv.delete).toHaveBeenCalled();
  });

  it("does not delete the CV of another user", async () => {
    prisma.cv.findUnique.mockResolvedValue(storedCv({ userId: "user-2" }));

    expect(await rejection(service.delete(USER, "cv-1"))).toBeInstanceOf(NotFoundException);
    expect(prisma.cv.delete).not.toHaveBeenCalled();
  });

  it("answers NOT_FOUND when the CV is deleted after the access check", async () => {
    prisma.cv.findUnique.mockResolvedValue(storedCv());
    prisma.cv.delete.mockRejectedValue(missingRecordError());

    expect(await rejection(service.delete(USER, "cv-1"))).toBeInstanceOf(NotFoundException);
  });

  it("passes on other database errors", async () => {
    const failure = new Error("connection lost");
    prisma.cv.findUnique.mockResolvedValue(storedCv());
    prisma.cv.delete.mockRejectedValue(failure);

    expect(await rejection(service.delete(USER, "cv-1"))).toBe(failure);
  });
});
