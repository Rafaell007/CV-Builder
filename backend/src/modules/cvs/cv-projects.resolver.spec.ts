import { UnauthorizedException } from "@nestjs/common";
import type { AuthUser } from "../../common/auth";
import { VERIFIED_KEY } from "../../common/auth/decorators";
import { Role } from "../../generated/prisma/enums";
import { CvProjectsResolver } from "./cv-projects.resolver";
import type { CvProjectsService } from "./cv-projects.service";
import type { AddCvProjectInput } from "./dto/add-cv-project.input";
import type { CvProjectsArgs } from "./dto/cv-projects.args";
import type { RemoveCvProjectsInput } from "./dto/remove-cv-projects.input";
import type { UpdateCvProjectInput } from "./dto/update-cv-project.input";

const USER: AuthUser = { id: "user-1", role: Role.USER, isVerified: true };
const ENTRY = { id: "entry-1" };

function setup() {
  const service = {
    list: jest.fn().mockResolvedValue([ENTRY]),
    add: jest.fn().mockResolvedValue(ENTRY),
    update: jest.fn().mockResolvedValue(ENTRY),
    remove: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<CvProjectsService>;
  return { resolver: new CvProjectsResolver(service), service };
}

describe("CvProjectsResolver", () => {
  it("passes the signed-in user and the input to the service", async () => {
    const { resolver, service } = setup();
    const args = { cvId: "cv-1" } as CvProjectsArgs;
    const add = { cvId: "cv-1", projectId: "p-1" } as AddCvProjectInput;
    const update = { id: "entry-1" } as UpdateCvProjectInput;
    const remove = { cvId: "cv-1", ids: ["entry-1"] } as RemoveCvProjectsInput;

    await expect(resolver.cvProjects(USER, args)).resolves.toEqual([ENTRY]);
    await expect(resolver.addCvProject(USER, add)).resolves.toBe(ENTRY);
    await expect(resolver.updateCvProject(USER, update)).resolves.toBe(ENTRY);
    await expect(resolver.removeCvProjects(USER, remove)).resolves.toBe(true);

    expect(service.list).toHaveBeenCalledWith(USER, args);
    expect(service.add).toHaveBeenCalledWith(USER, add);
    expect(service.update).toHaveBeenCalledWith(USER, update);
    expect(service.remove).toHaveBeenCalledWith(USER, remove);
  });

  it("refuses a call without a user", async () => {
    const { resolver, service } = setup();

    expect(() => resolver.cvProjects(undefined, { cvId: "cv-1" } as CvProjectsArgs)).toThrow(
      UnauthorizedException,
    );
    await expect(
      resolver.removeCvProjects(undefined, { cvId: "cv-1", ids: [] }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(service.list).not.toHaveBeenCalled();
    expect(service.remove).not.toHaveBeenCalled();
  });

  it("requires a verified email for the three mutations only (D16)", () => {
    const verified = (handler: unknown): unknown =>
      Reflect.getMetadata(VERIFIED_KEY, handler as object) as unknown;

    expect(verified(CvProjectsResolver.prototype.addCvProject)).toBe(true);
    expect(verified(CvProjectsResolver.prototype.updateCvProject)).toBe(true);
    expect(verified(CvProjectsResolver.prototype.removeCvProjects)).toBe(true);
    expect(verified(CvProjectsResolver.prototype.cvProjects)).toBeUndefined();
  });
});
