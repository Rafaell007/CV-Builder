import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnsupportedMediaTypeException,
} from "@nestjs/common";
import { Prisma } from "../../../generated/prisma/client";
import type { PrismaService } from "../../../prisma/prisma.service";
import { Role } from "../../auth/models/role.enum";
import { UNSUPPORTED_FILE_TYPE_REASON } from "./avatars.constants";
import { AvatarsService } from "./avatars.service";

const OWNER_ID = "6f1d3c52-8a0e-4f6c-9a43-2b7d5e1c9a10";
const OTHER_ID = "0b8e9a3c-1f2d-4e5a-8b6c-7d9e0f1a2b3c";
const ADMIN_ID = "9c7b6a5d-4e3f-4a1b-9c8d-7e6f5a4b3c2d";

const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const GIF = new Uint8Array(Buffer.from("GIF89a..."));
const TEXT = new Uint8Array(Buffer.from("not an image"));

const prisma = {
  avatar: { findUnique: jest.fn(), upsert: jest.fn(), deleteMany: jest.fn() },
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

function createService(): AvatarsService {
  return new AvatarsService(prisma as unknown as PrismaService);
}

beforeEach(() => {
  jest.resetAllMocks();
  prisma.$transaction.mockImplementation((work: (tx: typeof prisma) => Promise<unknown>) =>
    work(prisma),
  );
});

describe("AvatarsService.find", () => {
  it("returns the stored image and its type", async () => {
    prisma.avatar.findUnique.mockResolvedValue({ data: PNG, mimeType: "image/png" });

    await expect(createService().find(OWNER_ID)).resolves.toEqual({
      data: PNG,
      mimeType: "image/png",
    });
    expect(prisma.avatar.findUnique).toHaveBeenCalledWith({
      where: { userId: OWNER_ID },
      select: { data: true, mimeType: true },
    });
  });

  it("answers NOT_FOUND when the user has no avatar", async () => {
    prisma.avatar.findUnique.mockResolvedValue(null);

    await expect(createService().find(OWNER_ID)).rejects.toThrow(NotFoundException);
  });
});

describe("AvatarsService.upload", () => {
  it("lets the owner save their avatar, with the type read from the content", async () => {
    lockedRows(owner);

    await createService().upload(OWNER_ID, GIF, OWNER_ID);

    expect(prisma.avatar.upsert).toHaveBeenCalledWith({
      where: { userId: OWNER_ID },
      create: { userId: OWNER_ID, data: GIF, mimeType: "image/gif" },
      update: { data: GIF, mimeType: "image/gif" },
    });
  });

  it("lets an admin save the avatar of another user", async () => {
    lockedRows(owner, admin);

    await createService().upload(OWNER_ID, PNG, ADMIN_ID);

    expect(prisma.avatar.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: { userId: OWNER_ID, data: PNG, mimeType: "image/png" } }),
    );
  });

  it("matches an id sent in upper case with the locked row", async () => {
    lockedRows(owner);

    await createService().upload(OWNER_ID.toUpperCase(), PNG, OWNER_ID);

    expect(prisma.avatar.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: OWNER_ID } }),
    );
  });

  it("refuses another user as FORBIDDEN and saves nothing", async () => {
    lockedRows(owner, other);

    await expect(createService().upload(OWNER_ID, PNG, OTHER_ID)).rejects.toThrow(
      ForbiddenException,
    );
    expect(prisma.avatar.upsert).not.toHaveBeenCalled();
  });

  it("answers FORBIDDEN, not NOT_FOUND, to a user who sends an unknown id", async () => {
    lockedRows(other);

    await expect(createService().upload(OWNER_ID, PNG, OTHER_ID)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it("answers NOT_FOUND to an admin who sends an unknown id", async () => {
    lockedRows(admin);

    await expect(createService().upload(OWNER_ID, PNG, ADMIN_ID)).rejects.toThrow(
      NotFoundException,
    );
  });

  it("refuses a file that is not a PNG, JPG or GIF with 415 and keeps the old avatar", async () => {
    lockedRows(owner);

    const error: unknown = await createService()
      .upload(OWNER_ID, TEXT, OWNER_ID)
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(UnsupportedMediaTypeException);
    expect((error as UnsupportedMediaTypeException).getResponse()).toMatchObject({
      reason: UNSUPPORTED_FILE_TYPE_REASON,
    });
    expect(prisma.avatar.upsert).not.toHaveBeenCalled();
  });

  it("checks the permission before the file, so a stranger learns nothing about it", async () => {
    lockedRows(owner, other);

    await expect(createService().upload(OWNER_ID, TEXT, OTHER_ID)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it("turns a transaction timeout into a CONFLICT to try again", async () => {
    prisma.$transaction.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("timeout", { code: "P2028", clientVersion: "7" }),
    );

    await expect(createService().upload(OWNER_ID, PNG, OWNER_ID)).rejects.toThrow(
      ConflictException,
    );
  });
});

describe("AvatarsService.remove", () => {
  it("lets the owner remove their avatar", async () => {
    lockedRows(owner);

    await createService().remove(OWNER_ID, OWNER_ID);

    expect(prisma.avatar.deleteMany).toHaveBeenCalledWith({ where: { userId: OWNER_ID } });
  });

  it("lets an admin remove the avatar of another user", async () => {
    lockedRows(owner, admin);

    await createService().remove(OWNER_ID, ADMIN_ID);

    expect(prisma.avatar.deleteMany).toHaveBeenCalledWith({ where: { userId: OWNER_ID } });
  });

  it("is not an error when there is no avatar to remove", async () => {
    lockedRows(owner);
    prisma.avatar.deleteMany.mockResolvedValue({ count: 0 });

    await expect(createService().remove(OWNER_ID, OWNER_ID)).resolves.toBeUndefined();
  });

  it("refuses another user as FORBIDDEN and removes nothing", async () => {
    lockedRows(owner, other);

    await expect(createService().remove(OWNER_ID, OTHER_ID)).rejects.toThrow(ForbiddenException);
    expect(prisma.avatar.deleteMany).not.toHaveBeenCalled();
  });
});
