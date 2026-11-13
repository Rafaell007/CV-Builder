import { UnauthorizedException } from "@nestjs/common";
import type { AuthUser } from "../../../common/auth";
import { VERIFIED_KEY } from "../../../common/auth/decorators";
import { Role } from "../../../generated/prisma/enums";
import { CvSkillsResolver } from "./cv-skills.resolver";
import type { CvSkillsService } from "./cv-skills.service";
import type { AddCvSkillInput } from "./dto/add-cv-skill.input";
import type { RemoveCvSkillsInput } from "./dto/remove-cv-skills.input";
import type { UpdateCvSkillInput } from "./dto/update-cv-skill.input";

const USER: AuthUser = { id: "user-1", role: Role.USER, isVerified: true };
const LINK = { id: "link-1" };

function setup() {
  const service = {
    list: jest.fn().mockResolvedValue([LINK]),
    listAvailable: jest.fn().mockResolvedValue([{ id: "skill-1" }]),
    add: jest.fn().mockResolvedValue(LINK),
    update: jest.fn().mockResolvedValue(LINK),
    remove: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<CvSkillsService>;
  return { resolver: new CvSkillsResolver(service), service };
}

describe("CvSkillsResolver", () => {
  it("passes the signed-in user and the input to the service", async () => {
    const { resolver, service } = setup();
    const add = { cvId: "cv-1", skillId: "skill-1" } as AddCvSkillInput;
    const update = { id: "link-1", mastery: "EXPERT" } as UpdateCvSkillInput;
    const remove = { cvId: "cv-1", ids: ["link-1"] } as RemoveCvSkillsInput;

    await expect(resolver.cvSkills(USER, { cvId: "cv-1" })).resolves.toEqual([LINK]);
    await expect(resolver.availableCvSkills(USER, { cvId: "cv-1" })).resolves.toEqual([
      { id: "skill-1" },
    ]);
    await expect(resolver.addCvSkill(USER, add)).resolves.toBe(LINK);
    await expect(resolver.updateCvSkill(USER, update)).resolves.toBe(LINK);
    await expect(resolver.removeCvSkills(USER, remove)).resolves.toBe(true);

    expect(service.list).toHaveBeenCalledWith(USER, "cv-1");
    expect(service.listAvailable).toHaveBeenCalledWith(USER, "cv-1");
    expect(service.add).toHaveBeenCalledWith(USER, add);
    expect(service.update).toHaveBeenCalledWith(USER, update);
    expect(service.remove).toHaveBeenCalledWith(USER, remove);
  });

  it("refuses a call without a user", async () => {
    const { resolver, service } = setup();

    expect(() => resolver.cvSkills(undefined, { cvId: "cv-1" })).toThrow(UnauthorizedException);
    expect(() => resolver.availableCvSkills(undefined, { cvId: "cv-1" })).toThrow(
      UnauthorizedException,
    );
    await expect(
      resolver.removeCvSkills(undefined, { cvId: "cv-1", ids: [] }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(service.list).not.toHaveBeenCalled();
    expect(service.remove).not.toHaveBeenCalled();
  });

  it("requires a verified email for the three mutations only (D16)", () => {
    const verified = (handler: unknown): unknown =>
      Reflect.getMetadata(VERIFIED_KEY, handler as object) as unknown;

    expect(verified(CvSkillsResolver.prototype.addCvSkill)).toBe(true);
    expect(verified(CvSkillsResolver.prototype.updateCvSkill)).toBe(true);
    expect(verified(CvSkillsResolver.prototype.removeCvSkills)).toBe(true);
    expect(verified(CvSkillsResolver.prototype.cvSkills)).toBeUndefined();
    expect(verified(CvSkillsResolver.prototype.availableCvSkills)).toBeUndefined();
  });
});
