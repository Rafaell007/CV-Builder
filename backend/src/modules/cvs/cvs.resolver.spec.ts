import { UnauthorizedException } from "@nestjs/common";
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
    await resolver.cv(USER, "cv-1");
    await resolver.createCv(USER, input);
    await resolver.updateCv(USER, update);
    await resolver.deleteCv(USER, "cv-1", "user-2");

    expect(service.list).toHaveBeenCalledWith(USER, args);
    expect(service.get).toHaveBeenCalledWith(USER, "cv-1");
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
