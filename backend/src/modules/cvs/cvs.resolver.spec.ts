import { ParseUUIDPipe, UnauthorizedException } from "@nestjs/common";
import { ROUTE_ARGS_METADATA } from "@nestjs/common/constants";
import type { AuthUser } from "../../common/auth";
import { VERIFIED_KEY } from "../../common/auth/decorators";
import { PageInput } from "../../common/pagination";
import { Role } from "../../generated/prisma/enums";
import { CvsResolver } from "./cvs.resolver";
import type { CvsService } from "./cvs.service";
import type { CvsArgs } from "./dto/cvs.args";

const USER: AuthUser = { id: "user-1", role: Role.USER, isVerified: true };
const CV = { id: "cv-1" };

function setup() {
  const service = {
    list: jest.fn().mockResolvedValue({ items: [CV], total: 1 }),
    get: jest.fn().mockResolvedValue(CV),
    create: jest.fn().mockResolvedValue(CV),
    update: jest.fn().mockResolvedValue(CV),
    delete: jest.fn().mockResolvedValue(CV),
  } as unknown as jest.Mocked<CvsService>;
  return { resolver: new CvsResolver(service), service };
}

describe("CvsResolver", () => {
  it("passes the signed-in user and the arguments to the service", async () => {
    const { resolver, service } = setup();
    const args = { page: new PageInput() } as CvsArgs;
    const input = { name: "n", education: "e", description: "d" };
    const update = { id: "cv-1", ...input };

    await resolver.cvs(USER, args);
    await resolver.cv(USER, "cv-1", "user-2");
    await resolver.createCv(USER, input);
    await resolver.updateCv(USER, update);
    await resolver.deleteCv(USER, "cv-1", "user-2");

    expect(service.list).toHaveBeenCalledWith(USER, args);
    expect(service.get).toHaveBeenCalledWith(USER, "cv-1", "user-2");
    expect(service.create).toHaveBeenCalledWith(USER, input);
    expect(service.update).toHaveBeenCalledWith(USER, update);
    expect(service.delete).toHaveBeenCalledWith(USER, "cv-1", "user-2");
  });

  it("refuses a call without a user", () => {
    const { resolver, service } = setup();

    expect(() => resolver.cv(undefined, "cv-1")).toThrow(UnauthorizedException);
    expect(service.get).not.toHaveBeenCalled();
  });

  it("passes undefined as the user id of deleteCv when the client sends null", async () => {
    const { resolver, service } = setup();

    await resolver.deleteCv(USER, "cv-1", null as unknown as string);

    expect(service.delete).toHaveBeenCalledWith(USER, "cv-1", undefined);
  });

  it.each([
    ["cvs", (r: CvsResolver) => r.cvs(undefined, { page: new PageInput() } as CvsArgs)],
    [
      "createCv",
      (r: CvsResolver) => r.createCv(undefined, { name: "n", education: "e", description: "d" }),
    ],
    [
      "updateCv",
      (r: CvsResolver) =>
        r.updateCv(undefined, { id: "cv-1", name: "n", education: "e", description: "d" }),
    ],
    ["deleteCv", (r: CvsResolver) => r.deleteCv(undefined, "cv-1")],
  ])("refuses %s without a user", (name, call) => {
    const { resolver, service } = setup();

    expect(() => call(resolver)).toThrow(UnauthorizedException);
    expect(service.list).not.toHaveBeenCalled();
    expect(service.create).not.toHaveBeenCalled();
    expect(service.update).not.toHaveBeenCalled();
    expect(service.delete).not.toHaveBeenCalled();
  });

  describe("pipes of the id arguments", () => {
    type ArgMetadata = Record<
      string,
      { data?: string; pipes: (ParseUUIDPipe | typeof ParseUUIDPipe)[] }
    >;
    const METADATA = { type: "custom" as const };

    /** The pipe of a named argument of a resolver method, as an instance. */
    function pipeOf(method: string, argument: string): ParseUUIDPipe {
      const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, CvsResolver, method) as ArgMetadata;
      const found = Object.values(args).find((arg) => arg.data === argument);
      const [pipe] = found?.pipes ?? [];
      if (pipe === undefined) throw new Error(`No pipe on ${method}.${argument}`);
      return typeof pipe === "function" ? new pipe() : pipe;
    }

    it.each(["cv", "deleteCv"])("%s accepts only a UUID as id", async (method) => {
      const pipe = pipeOf(method, "id");

      await expect(pipe.transform("not-a-uuid", METADATA)).rejects.toThrow();
      await expect(pipe.transform("8d3310a1-2b4c-4d5e-8f60-1a2b3c4d5e6f", METADATA)).resolves.toBe(
        "8d3310a1-2b4c-4d5e-8f60-1a2b3c4d5e6f",
      );
    });

    it.each(["cv", "deleteCv"])("%s accepts only a UUID or no value as userId", async (method) => {
      const pipe = pipeOf(method, "userId");

      await expect(pipe.transform("not-a-uuid", METADATA)).rejects.toThrow();
      await expect(
        pipe.transform(undefined as unknown as string, METADATA),
      ).resolves.toBeUndefined();
      await expect(pipe.transform(null as unknown as string, METADATA)).resolves.toBeNull();
    });
  });

  it("requires a verified email for the three mutations only (D16)", () => {
    const verified = (handler: unknown): unknown =>
      Reflect.getMetadata(VERIFIED_KEY, handler as object) as unknown;

    expect(verified(CvsResolver.prototype.createCv)).toBe(true);
    expect(verified(CvsResolver.prototype.updateCv)).toBe(true);
    expect(verified(CvsResolver.prototype.deleteCv)).toBe(true);
    expect(verified(CvsResolver.prototype.cvs)).toBeUndefined();
    expect(verified(CvsResolver.prototype.cv)).toBeUndefined();
  });
});
