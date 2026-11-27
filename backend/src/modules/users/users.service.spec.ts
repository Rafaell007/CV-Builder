import {
  ConflictException,
  ForbiddenException,
  HttpException,
  NotFoundException,
} from "@nestjs/common";
import { ValidationFailedException } from "../../common/errors";
import { PageInput, SortDirection } from "../../common/pagination";
import { Prisma } from "../../generated/prisma/client";
import type { PrismaService } from "../../prisma/prisma.service";
import { EMAIL_TAKEN_REASON } from "../auth/auth.service";
import { Role } from "../auth/models/role.enum";
import { hashPassword } from "../auth/password";
import { CONCURRENT_CHANGE_REASON } from "./user-lock";
import { OWN_ROLE_REASON, SELF_DELETE_REASON, UsersService } from "./users.service";

// argon2 is slow and its output random; the tests only need to know the service stores what it returns.
jest.mock("../auth/password", () => ({ hashPassword: jest.fn() }));

const ID = "6f1d3c52-8a0e-4f6c-9a43-2b7d5e1c9a10";
const ACTOR_ID = "0b8e9a3c-1f2d-4e5a-8b6c-7d9e0f1a2b3c";
const OTHER_ADMIN_ID = "9c7b6a5d-4e3f-4a1b-9c8d-7e6f5a4b3c2d";
const DEPARTMENT_ID = "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d";
const POSITION_ID = "2b3c4d5e-6f7a-4b8c-9d0e-1f2a3b4c5d6e";

const PROFILE = {
  firstName: "Alpha",
  lastName: "Lima",
  departmentId: DEPARTMENT_ID,
  positionId: POSITION_ID,
  role: Role.USER,
};
const CREATE_INPUT = { ...PROFILE, email: "alpha@example.com", password: "secret12" };
const USER_FIELDS = {
  id: ID,
  email: "alpha@example.com",
  firstName: "Alpha",
  lastName: "Lima",
  role: Role.USER,
  department: { id: DEPARTMENT_ID, name: "Engineering" },
  position: { id: POSITION_ID, name: "Developer" },
  createdAt: new Date("2024-01-14T09:30:00.000Z"),
};
/** The row Prisma returns for `SELECT`: a user without an avatar. */
const USER_ROW = { ...USER_FIELDS, avatar: null };
/** The `User` the service returns for `USER_ROW`. */
const USER = { ...USER_FIELDS, avatarUrl: null };
const AVATAR_UPDATED_AT = new Date("2026-11-26T10:00:00.000Z");
const USER_ROW_WITH_AVATAR = { ...USER_FIELDS, avatar: { updatedAt: AVATAR_UPDATED_AT } };
const USER_WITH_AVATAR = {
  ...USER_FIELDS,
  avatarUrl: `/api/users/${ID}/avatar?v=${AVATAR_UPDATED_AT.getTime()}`,
};
const SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  department: { select: { id: true, name: true } },
  position: { select: { id: true, name: true } },
  createdAt: true,
  avatar: { select: { updatedAt: true } },
};

const prisma = {
  user: {
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  department: { findUnique: jest.fn() },
  position: { findUnique: jest.fn() },
  $queryRaw: jest.fn(),
  $transaction: jest.fn(),
};

function createService(): UsersService {
  return new UsersService(prisma as unknown as PrismaService);
}

/** Runs a batch (array) like Prisma does, or an interactive callback with the same mock client. */
function runTransaction(work: Promise<unknown>[] | ((tx: typeof prisma) => Promise<unknown>)) {
  return typeof work === "function" ? work(prisma) : Promise.all(work);
}

function databaseError(code: string): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError("database error", {
    code,
    clientVersion: "test",
  });
}

/** What the row lock returns: the actor and the target that exist, as `{ id, role }`. */
function lockedRows(...rows: [string, Role][]): { id: string; role: Role }[] {
  return rows.map(([id, role]) => ({ id, role }));
}

/** The `reason` a `CONFLICT` (or another HTTP error) carries in its body. */
async function reasonOf(promise: Promise<unknown>): Promise<unknown> {
  const error: unknown = await promise.then(
    () => undefined,
    (rejection: unknown) => rejection,
  );
  expect(error).toBeInstanceOf(ConflictException);
  return ((error as HttpException).getResponse() as { reason?: unknown }).reason;
}

/** The field errors of a `BAD_USER_INPUT`. */
async function fieldErrorsOf(promise: Promise<unknown>): Promise<unknown> {
  const error: unknown = await promise.then(
    () => undefined,
    (rejection: unknown) => rejection,
  );
  expect(error).toBeInstanceOf(ValidationFailedException);
  return (error as ValidationFailedException).fieldErrors;
}

const page = (): PageInput => new PageInput();

describe("UsersService", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    prisma.$transaction.mockImplementation(runTransaction);
    prisma.department.findUnique.mockResolvedValue({ id: DEPARTMENT_ID });
    prisma.position.findUnique.mockResolvedValue({ id: POSITION_ID });
    jest.mocked(hashPassword).mockResolvedValue("argon2-hash");
  });

  describe("list", () => {
    beforeEach(() => {
      prisma.user.findMany.mockResolvedValue([USER_ROW]);
      prisma.user.count.mockResolvedValue(1);
    });

    it("returns the users and the total, without the password hash", async () => {
      await expect(createService().list({ page: page() })).resolves.toEqual({
        items: [USER],
        total: 1,
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ select: SELECT }),
      );
    });

    it("gives each user with an avatar its address, in the same query", async () => {
      prisma.user.findMany.mockResolvedValue([USER_ROW_WITH_AVATAR, USER_ROW]);
      prisma.user.count.mockResolvedValue(2);

      await expect(createService().list({ page: page() })).resolves.toEqual({
        items: [USER_WITH_AVATAR, USER],
        total: 2,
      });
      expect(prisma.user.findMany).toHaveBeenCalledTimes(1);
    });

    it("sorts by first name ascending when no sort is given, then by id", async () => {
      await createService().list({ page: page() });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: [{ firstName: "asc" }, { id: "asc" }] }),
      );
    });

    it("sorts by last name descending", async () => {
      await createService().list({
        page: page(),
        sort: { field: "lastName", direction: SortDirection.DESC },
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: [{ lastName: "desc" }, { id: "asc" }] }),
      );
    });

    it("sorts by the department's name", async () => {
      await createService().list({
        page: page(),
        sort: { field: "department", direction: SortDirection.DESC },
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: [{ department: { name: "desc" } }, { id: "asc" }] }),
      );
    });

    it("sorts by the position's name", async () => {
      await createService().list({
        page: page(),
        sort: { field: "position", direction: SortDirection.ASC },
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: [{ position: { name: "asc" } }, { id: "asc" }] }),
      );
    });

    it.each(["email", "passwordHash", "role"])(
      "rejects the sort field %j, which is not a sortable column",
      async (field) => {
        await expect(
          createService().list({ page: page(), sort: { field, direction: SortDirection.ASC } }),
        ).rejects.toThrow(ValidationFailedException);
        expect(prisma.user.findMany).not.toHaveBeenCalled();
      },
    );

    it("needs every word of the search in a name or the email, in the same query as the count", async () => {
      await createService().list({ search: "  alpha   LIM ", page: page() });

      const matches = (word: string) => {
        const contains = { contains: word, mode: "insensitive" };
        return { OR: [{ firstName: contains }, { lastName: contains }, { email: contains }] };
      };
      const where = { AND: [matches("alpha"), matches("LIM")] };
      expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({ where }));
      expect(prisma.user.count).toHaveBeenCalledWith({ where });
    });

    it("treats % and _ in the search as plain characters", async () => {
      await createService().list({ search: "a_b%", page: page() });

      const contains = { contains: "a\\_b\\%", mode: "insensitive" };
      expect(prisma.user.count).toHaveBeenCalledWith({
        where: {
          AND: [{ OR: [{ firstName: contains }, { lastName: contains }, { email: contains }] }],
        },
      });
    });

    it("returns all users for an empty search and skips the earlier pages", async () => {
      await createService().list({ search: "   ", page: { number: 2, size: 20 } });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { AND: [] }, skip: 20, take: 20 }),
      );
    });
  });

  describe("findOne", () => {
    it("returns the user without the password hash", async () => {
      prisma.user.findUnique.mockResolvedValue(USER_ROW);

      await expect(createService().findOne(ID)).resolves.toEqual(USER);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: ID }, select: SELECT });
    });

    it("returns the avatar's address with the upload time as the version", async () => {
      prisma.user.findUnique.mockResolvedValue(USER_ROW_WITH_AVATAR);

      await expect(createService().findOne(ID)).resolves.toEqual(USER_WITH_AVATAR);
    });

    it("fails with NOT_FOUND for an unknown user", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(createService().findOne(ID)).rejects.toThrow(
        new NotFoundException("User not found"),
      );
    });
  });

  describe("create", () => {
    it("saves a verified user with the hash, never the password, and returns it", async () => {
      prisma.user.create.mockResolvedValue(USER_ROW);

      await expect(createService().create(CREATE_INPUT)).resolves.toEqual(USER);

      expect(hashPassword).toHaveBeenCalledWith("secret12");
      // `toHaveBeenCalledWith` compares the whole object, so a `password` key in `data` would fail it.
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          ...PROFILE,
          email: "alpha@example.com",
          passwordHash: "argon2-hash",
          isVerified: true,
        },
        select: SELECT,
      });
    });

    it("names every missing department or position, before hashing anything", async () => {
      prisma.department.findUnique.mockResolvedValue(null);
      prisma.position.findUnique.mockResolvedValue(null);

      await expect(fieldErrorsOf(createService().create(CREATE_INPUT))).resolves.toEqual([
        { field: "departmentId", messages: ["Department not found"] },
        { field: "positionId", messages: ["Position not found"] },
      ]);
      expect(hashPassword).not.toHaveBeenCalled();
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it("fails with CONFLICT and reason EMAIL_TAKEN for an email that exists", async () => {
      prisma.user.create.mockRejectedValue(databaseError("P2002"));

      await expect(reasonOf(createService().create(CREATE_INPUT))).resolves.toBe(
        EMAIL_TAKEN_REASON,
      );
    });

    it("names the field when the position is deleted between the check and the save", async () => {
      prisma.user.create.mockRejectedValue(databaseError("P2003"));
      prisma.position.findUnique.mockResolvedValueOnce({ id: POSITION_ID }).mockResolvedValue(null);

      await expect(fieldErrorsOf(createService().create(CREATE_INPUT))).resolves.toEqual([
        { field: "positionId", messages: ["Position not found"] },
      ]);
    });

    it("passes on a foreign-key error when the department and position still exist", async () => {
      const error = databaseError("P2003");
      prisma.user.create.mockRejectedValue(error);

      await expect(createService().create(CREATE_INPUT)).rejects.toBe(error);
    });

    it("passes on other errors", async () => {
      const error = new Error("connection lost");
      prisma.user.create.mockRejectedValue(error);

      await expect(createService().create(CREATE_INPUT)).rejects.toBe(error);
    });
  });

  describe("update", () => {
    const input = { id: ID, ...PROFILE };

    it("locks the actor and the target, then saves the changes and returns the user", async () => {
      prisma.$queryRaw.mockResolvedValue(lockedRows([ACTOR_ID, Role.ADMIN], [ID, Role.USER]));
      prisma.user.update.mockResolvedValue(USER_ROW);

      await expect(createService().update(input, ACTOR_ID)).resolves.toEqual(USER);

      expect(prisma.$queryRaw).toHaveBeenCalledWith(expect.anything(), ID, ACTOR_ID);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: ID },
        data: PROFILE,
        select: SELECT,
      });
    });

    it("finds the user when the id comes in upper case", async () => {
      prisma.$queryRaw.mockResolvedValue(lockedRows([ACTOR_ID, Role.ADMIN], [ID, Role.USER]));
      prisma.user.update.mockResolvedValue(USER_ROW);

      await expect(
        createService().update({ ...input, id: ID.toUpperCase() }, ACTOR_ID),
      ).resolves.toEqual(USER);

      expect(prisma.$queryRaw).toHaveBeenCalledWith(expect.anything(), ID, ACTOR_ID);
    });

    it("refuses OWN_ROLE when the admin's own id comes in upper case", async () => {
      prisma.$queryRaw.mockResolvedValue(
        lockedRows([ACTOR_ID, Role.ADMIN], [OTHER_ADMIN_ID, Role.ADMIN]),
      );

      await expect(
        reasonOf(createService().update({ ...input, id: ACTOR_ID.toUpperCase() }, ACTOR_ID)),
      ).resolves.toBe(OWN_ROLE_REASON);
    });

    it("names a missing department, checked inside the lock, and saves nothing", async () => {
      prisma.$queryRaw.mockResolvedValue(lockedRows([ACTOR_ID, Role.ADMIN], [ID, Role.USER]));
      prisma.department.findUnique.mockResolvedValue(null);

      await expect(fieldErrorsOf(createService().update(input, ACTOR_ID))).resolves.toEqual([
        { field: "departmentId", messages: ["Department not found"] },
      ]);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("says NOT_FOUND, not a field error, for a deleted user whose department is gone too", async () => {
      prisma.$queryRaw.mockResolvedValue(lockedRows([ACTOR_ID, Role.ADMIN]));
      prisma.department.findUnique.mockResolvedValue(null);

      await expect(createService().update(input, ACTOR_ID)).rejects.toThrow(
        new NotFoundException("User not found"),
      );
    });

    it("fails with NOT_FOUND for an unknown user", async () => {
      prisma.$queryRaw.mockResolvedValue(lockedRows([ACTOR_ID, Role.ADMIN]));

      await expect(createService().update(input, ACTOR_ID)).rejects.toThrow(
        new NotFoundException("User not found"),
      );
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("refuses an admin who removes their own Admin role (OWN_ROLE)", async () => {
      prisma.$queryRaw.mockResolvedValue(
        lockedRows([ACTOR_ID, Role.ADMIN], [OTHER_ADMIN_ID, Role.ADMIN]),
      );

      await expect(
        reasonOf(createService().update({ ...input, id: ACTOR_ID }, ACTOR_ID)),
      ).resolves.toBe(OWN_ROLE_REASON);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("lets an admin change their own names while keeping the Admin role", async () => {
      prisma.$queryRaw.mockResolvedValue(lockedRows([ACTOR_ID, Role.ADMIN]));
      prisma.user.update.mockResolvedValue(USER_ROW);

      await createService().update({ ...input, id: ACTOR_ID, role: Role.ADMIN }, ACTOR_ID);

      expect(prisma.user.update).toHaveBeenCalled();
    });

    it.each([
      ["demoted", lockedRows([ACTOR_ID, Role.USER], [ID, Role.ADMIN])],
      ["deleted", lockedRows([ID, Role.ADMIN])],
    ])(
      "refuses with FORBIDDEN an actor who was %s by a parallel request after the guard passed",
      async (_case, rows) => {
        prisma.$queryRaw.mockResolvedValue(rows);

        await expect(createService().update(input, ACTOR_ID)).rejects.toThrow(ForbiddenException);
        expect(prisma.user.update).not.toHaveBeenCalled();
      },
    );

    it("demotes another admin", async () => {
      prisma.$queryRaw.mockResolvedValue(lockedRows([ACTOR_ID, Role.ADMIN], [ID, Role.ADMIN]));
      prisma.user.update.mockResolvedValue(USER_ROW);

      await createService().update(input, ACTOR_ID);

      expect(prisma.user.update).toHaveBeenCalled();
    });

    it("names the field when the department is deleted during the save", async () => {
      prisma.$queryRaw.mockResolvedValue(lockedRows([ACTOR_ID, Role.ADMIN], [ID, Role.USER]));
      prisma.user.update.mockRejectedValue(databaseError("P2003"));
      prisma.department.findUnique
        .mockResolvedValueOnce({ id: DEPARTMENT_ID })
        .mockResolvedValue(null);

      await expect(fieldErrorsOf(createService().update(input, ACTOR_ID))).resolves.toEqual([
        { field: "departmentId", messages: ["Department not found"] },
      ]);
    });

    it.each([
      ["P2034", "a deadlock or write conflict"],
      ["P2028", "a transaction that did not finish in time"],
    ])("fails with a CONFLICT to retry on %s (%s)", async (code) => {
      prisma.$queryRaw.mockResolvedValue(lockedRows([ACTOR_ID, Role.ADMIN], [ID, Role.USER]));
      prisma.user.update.mockRejectedValue(databaseError(code));

      await expect(reasonOf(createService().update(input, ACTOR_ID))).resolves.toBe(
        CONCURRENT_CHANGE_REASON,
      );
    });
  });

  describe("updateProfile", () => {
    const profile = {
      firstName: PROFILE.firstName,
      lastName: PROFILE.lastName,
      departmentId: DEPARTMENT_ID,
      positionId: POSITION_ID,
    };
    const input = { id: ID, ...profile };

    it("lets the owner save their profile, locked like update, without touching the role", async () => {
      // The owner is both the actor and the target, so the lock returns one row.
      prisma.$queryRaw.mockResolvedValue(lockedRows([ID, Role.USER]));
      prisma.user.update.mockResolvedValue(USER_ROW);

      await expect(createService().updateProfile(input, ID)).resolves.toEqual(USER);

      expect(prisma.$queryRaw).toHaveBeenCalledWith(expect.anything(), ID, ID);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: ID },
        data: profile,
        select: SELECT,
      });
    });

    it("lets the owner save when their id comes in upper case", async () => {
      prisma.$queryRaw.mockResolvedValue(lockedRows([ID, Role.USER]));
      prisma.user.update.mockResolvedValue(USER_ROW);

      await expect(
        createService().updateProfile({ ...input, id: ID.toUpperCase() }, ID),
      ).resolves.toEqual(USER);
    });

    it("lets an admin save another user's profile", async () => {
      prisma.$queryRaw.mockResolvedValue(lockedRows([ACTOR_ID, Role.ADMIN], [ID, Role.USER]));
      prisma.user.update.mockResolvedValue(USER_ROW);

      await expect(createService().updateProfile(input, ACTOR_ID)).resolves.toEqual(USER);
    });

    it.each([
      // Also an admin demoted by a parallel request after the guard passed: the lock reads the new role.
      ["a user who edits someone else", lockedRows([ACTOR_ID, Role.USER], [ID, Role.USER])],
      ["a user who probes an unknown id", lockedRows([ACTOR_ID, Role.USER])],
      ["an actor deleted by a parallel request", lockedRows([ID, Role.USER])],
    ])("refuses with FORBIDDEN %s and saves nothing", async (_case, rows) => {
      prisma.$queryRaw.mockResolvedValue(rows);

      await expect(createService().updateProfile(input, ACTOR_ID)).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("refuses with FORBIDDEN an owner deleted by a parallel request", async () => {
      prisma.$queryRaw.mockResolvedValue(lockedRows());

      await expect(createService().updateProfile(input, ID)).rejects.toThrow(ForbiddenException);
    });

    it("fails with NOT_FOUND, not a field error, when an admin edits an unknown user", async () => {
      prisma.$queryRaw.mockResolvedValue(lockedRows([ACTOR_ID, Role.ADMIN]));
      prisma.department.findUnique.mockResolvedValue(null);

      await expect(createService().updateProfile(input, ACTOR_ID)).rejects.toThrow(
        new NotFoundException("User not found"),
      );
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("names a missing department and position, checked inside the lock, and saves nothing", async () => {
      prisma.$queryRaw.mockResolvedValue(lockedRows([ID, Role.USER]));
      prisma.department.findUnique.mockResolvedValue(null);
      prisma.position.findUnique.mockResolvedValue(null);

      await expect(fieldErrorsOf(createService().updateProfile(input, ID))).resolves.toEqual([
        { field: "departmentId", messages: ["Department not found"] },
        { field: "positionId", messages: ["Position not found"] },
      ]);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("names the field when the position is deleted during the save", async () => {
      prisma.$queryRaw.mockResolvedValue(lockedRows([ID, Role.USER]));
      prisma.user.update.mockRejectedValue(databaseError("P2003"));
      prisma.position.findUnique.mockResolvedValueOnce({ id: POSITION_ID }).mockResolvedValue(null);

      await expect(fieldErrorsOf(createService().updateProfile(input, ID))).resolves.toEqual([
        { field: "positionId", messages: ["Position not found"] },
      ]);
    });

    it("fails with a CONFLICT to retry on a write conflict (P2034)", async () => {
      prisma.$queryRaw.mockResolvedValue(lockedRows([ID, Role.USER]));
      prisma.user.update.mockRejectedValue(databaseError("P2034"));

      await expect(reasonOf(createService().updateProfile(input, ID))).resolves.toBe(
        CONCURRENT_CHANGE_REASON,
      );
    });
  });

  describe("delete", () => {
    it("locks the actor and the target, then deletes the user", async () => {
      prisma.$queryRaw.mockResolvedValue(lockedRows([ACTOR_ID, Role.ADMIN], [ID, Role.USER]));

      await createService().delete(ID, ACTOR_ID);

      expect(prisma.$queryRaw).toHaveBeenCalledWith(expect.anything(), ID, ACTOR_ID);
      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: ID } });
    });

    it("refuses an admin who deletes themselves (SELF_DELETE), after the lock", async () => {
      prisma.$queryRaw.mockResolvedValue(lockedRows([ACTOR_ID, Role.ADMIN]));

      await expect(reasonOf(createService().delete(ACTOR_ID, ACTOR_ID))).resolves.toBe(
        SELF_DELETE_REASON,
      );
      expect(prisma.$queryRaw).toHaveBeenCalled();
      expect(prisma.user.delete).not.toHaveBeenCalled();
    });

    it("refuses SELF_DELETE when the admin's own id comes in upper case", async () => {
      prisma.$queryRaw.mockResolvedValue(lockedRows([ACTOR_ID, Role.ADMIN]));

      await expect(
        reasonOf(createService().delete(ACTOR_ID.toUpperCase(), ACTOR_ID)),
      ).resolves.toBe(SELF_DELETE_REASON);
    });

    it("refuses with FORBIDDEN, not SELF_DELETE, an actor demoted before they delete themselves", async () => {
      prisma.$queryRaw.mockResolvedValue(lockedRows([ACTOR_ID, Role.USER]));

      await expect(createService().delete(ACTOR_ID, ACTOR_ID)).rejects.toThrow(ForbiddenException);
      expect(prisma.user.delete).not.toHaveBeenCalled();
    });

    it.each([
      ["demoted", lockedRows([ACTOR_ID, Role.USER], [ID, Role.ADMIN])],
      ["deleted", lockedRows([ID, Role.ADMIN])],
    ])(
      "refuses with FORBIDDEN an actor who was %s by a parallel request after the guard passed",
      async (_case, rows) => {
        prisma.$queryRaw.mockResolvedValue(rows);

        await expect(createService().delete(ID, ACTOR_ID)).rejects.toThrow(ForbiddenException);
        expect(prisma.user.delete).not.toHaveBeenCalled();
      },
    );

    it("deletes another admin", async () => {
      prisma.$queryRaw.mockResolvedValue(lockedRows([ACTOR_ID, Role.ADMIN], [ID, Role.ADMIN]));

      await createService().delete(ID, ACTOR_ID);

      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: ID } });
    });

    it("fails with NOT_FOUND for an unknown user", async () => {
      prisma.$queryRaw.mockResolvedValue(lockedRows([ACTOR_ID, Role.ADMIN]));

      await expect(createService().delete(ID, ACTOR_ID)).rejects.toThrow(
        new NotFoundException("User not found"),
      );
      expect(prisma.user.delete).not.toHaveBeenCalled();
    });

    it.each([
      ["P2034", "a deadlock or write conflict"],
      ["P2028", "a transaction that did not finish in time"],
    ])("fails with a CONFLICT to retry on %s (%s)", async (code) => {
      prisma.$queryRaw.mockResolvedValue(lockedRows([ACTOR_ID, Role.ADMIN], [ID, Role.USER]));
      prisma.user.delete.mockRejectedValue(databaseError(code));

      await expect(reasonOf(createService().delete(ID, ACTOR_ID))).resolves.toBe(
        CONCURRENT_CHANGE_REASON,
      );
    });

    it("passes on other errors", async () => {
      const error = new Error("connection lost");
      prisma.$queryRaw.mockResolvedValue(lockedRows([ACTOR_ID, Role.ADMIN], [ID, Role.USER]));
      prisma.user.delete.mockRejectedValue(error);

      await expect(createService().delete(ID, ACTOR_ID)).rejects.toBe(error);
    });
  });
});
