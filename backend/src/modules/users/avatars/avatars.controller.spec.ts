import { BadRequestException, NotFoundException, StreamableFile } from "@nestjs/common";
import { IS_PUBLIC_KEY, ROLES_KEY, VERIFIED_KEY } from "../../../common/auth/decorators";
import { Role } from "../../../generated/prisma/enums";
import { AvatarsController, type HeaderResponse } from "./avatars.controller";
import type { AvatarsService } from "./avatars.service";

const USER_ID = "6f1d3c52-8a0e-4f6c-9a43-2b7d5e1c9a10";
const ACTOR = { id: "0b8e9a3c-1f2d-4e5a-8b6c-7d9e0f1a2b3c", role: Role.USER, isVerified: false };
const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const UPDATED_AT = new Date("2026-11-26T10:00:00.000Z");
const CURRENT_VERSION = String(UPDATED_AT.getTime());

function setup() {
  const service = {
    find: jest.fn().mockResolvedValue({ data: PNG, mimeType: "image/png", updatedAt: UPDATED_AT }),
    upload: jest.fn().mockResolvedValue(undefined),
    remove: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<AvatarsService>;
  const res = { setHeader: jest.fn() } satisfies HeaderResponse;
  return { controller: new AvatarsController(service), service, res };
}

const handler = (name: keyof AvatarsController): object => AvatarsController.prototype[name];

/** The part of a multer file the controller reads. */
function uploadedFile(buffer: Buffer): Express.Multer.File {
  return { buffer, size: buffer.length, mimetype: "image/png" } as Express.Multer.File;
}

describe("AvatarsController", () => {
  it.each(["find", "upload", "remove"] as const)(
    "%s needs a signed-in user, any role, verified or not",
    (name) => {
      for (const target of [AvatarsController, handler(name)]) {
        expect(Reflect.getMetadata(IS_PUBLIC_KEY, target)).toBeUndefined();
        expect(Reflect.getMetadata(ROLES_KEY, target)).toBeUndefined();
        expect(Reflect.getMetadata(VERIFIED_KEY, target)).toBeUndefined();
      }
    },
  );

  it("find sends the image with its stored type, nosniff and a long private cache for the current version", async () => {
    const { controller, res } = setup();

    const file = await controller.find(USER_ID, CURRENT_VERSION, res);

    expect(file).toBeInstanceOf(StreamableFile);
    expect(file.getHeaders()).toMatchObject({ type: "image/png", length: PNG.length });
    expect(res.setHeader).toHaveBeenCalledWith(
      "Cache-Control",
      "private, max-age=31536000, immutable",
    );
    expect(res.setHeader).toHaveBeenCalledWith("X-Content-Type-Options", "nosniff");
  });

  it("find sets no cache header when there is no avatar, so the 404 is not kept", async () => {
    const { controller, service, res } = setup();
    service.find.mockRejectedValue(new NotFoundException("Avatar not found"));

    await expect(controller.find(USER_ID, CURRENT_VERSION, res)).rejects.toThrow(NotFoundException);
    expect(res.setHeader).not.toHaveBeenCalled();
  });

  it.each([
    ["no version", undefined],
    ["an old version", String(UPDATED_AT.getTime() - 1000)],
    ["a made-up version", "abc"],
  ])("find sends no-cache for %s, so an old photo is never kept", async (_name, version) => {
    const { controller, res } = setup();

    await controller.find(USER_ID, version, res);

    expect(res.setHeader).toHaveBeenCalledWith("Cache-Control", "private, no-cache");
    expect(res.setHeader).toHaveBeenCalledWith("X-Content-Type-Options", "nosniff");
  });

  it("upload passes the user id, the file content and the signed-in user's id to the service", async () => {
    const { controller, service } = setup();

    await controller.upload(ACTOR, USER_ID, uploadedFile(Buffer.from(PNG)));

    expect(service.upload).toHaveBeenCalledWith(USER_ID, PNG, ACTOR.id);
  });

  it("upload answers 400 when the request has no file", async () => {
    const { controller, service } = setup();

    await expect(controller.upload(ACTOR, USER_ID, undefined)).rejects.toThrow(BadRequestException);
    expect(service.upload).not.toHaveBeenCalled();
  });

  it("remove passes the user id and the signed-in user's id to the service", async () => {
    const { controller, service } = setup();

    await controller.remove(ACTOR, USER_ID);

    expect(service.remove).toHaveBeenCalledWith(USER_ID, ACTOR.id);
  });
});
