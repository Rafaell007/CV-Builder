import { UnauthorizedException } from "@nestjs/common";
import type { AuthUser } from "../../../common/auth";
import { VERIFIED_KEY } from "../../../common/auth/decorators";
import { Mastery, Role } from "../../../generated/prisma/enums";
import type { AddUserSkillInput } from "./dto/add-user-skill.input";
import type { RemoveUserSkillsInput } from "./dto/remove-user-skills.input";
import type { UpdateUserSkillInput } from "./dto/update-user-skill.input";
import { UserSkillsResolver } from "./user-skills.resolver";
import type { UserSkillsService } from "./user-skills.service";

const USER: AuthUser = { id: "user-1", role: Role.USER, isVerified: true };
const LINK = { id: "link-1" };

const ADD: AddUserSkillInput = { userId: "user-1", skillId: "skill-1", mastery: Mastery.ADVANCED };
const UPDATE: UpdateUserSkillInput = { id: "link-1", mastery: Mastery.EXPERT };
const REMOVE: RemoveUserSkillsInput = { userId: "user-1", ids: ["link-1"] };

function setup() {
  const service = {
    list: jest.fn().mockResolvedValue([LINK]),
    add: jest.fn().mockResolvedValue(LINK),
    update: jest.fn().mockResolvedValue(LINK),
    remove: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<UserSkillsService>;
  return { resolver: new UserSkillsResolver(service), service };
}

describe("UserSkillsResolver", () => {
  it("passes the signed-in user and the input to the service", async () => {
    const { resolver, service } = setup();

    await expect(resolver.userSkills({ userId: "user-1" })).resolves.toEqual([LINK]);
    await expect(resolver.addUserSkill(USER, ADD)).resolves.toBe(LINK);
    await expect(resolver.updateUserSkill(USER, UPDATE)).resolves.toBe(LINK);
    await expect(resolver.removeUserSkills(USER, REMOVE)).resolves.toBe(true);

    expect(service.list).toHaveBeenCalledWith("user-1");
    expect(service.add).toHaveBeenCalledWith(USER, ADD);
    expect(service.update).toHaveBeenCalledWith(USER, UPDATE);
    expect(service.remove).toHaveBeenCalledWith(USER, REMOVE);
  });

  it("refuses the mutations without a user", async () => {
    const { resolver, service } = setup();

    expect(() => resolver.addUserSkill(undefined, ADD)).toThrow(UnauthorizedException);
    expect(() => resolver.updateUserSkill(undefined, UPDATE)).toThrow(UnauthorizedException);
    await expect(resolver.removeUserSkills(undefined, REMOVE)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(service.add).not.toHaveBeenCalled();
    expect(service.update).not.toHaveBeenCalled();
    expect(service.remove).not.toHaveBeenCalled();
  });

  it("passes on the error when the service cannot remove the skills", async () => {
    const { resolver, service } = setup();
    const failure = new Error("remove failed");
    service.remove.mockRejectedValue(failure);

    await expect(resolver.removeUserSkills(USER, REMOVE)).rejects.toBe(failure);
  });

  it("requires a verified email for the three mutations only (D16)", () => {
    const verified = (handler: unknown): unknown =>
      Reflect.getMetadata(VERIFIED_KEY, handler as object) as unknown;

    expect(verified(UserSkillsResolver.prototype.addUserSkill)).toBe(true);
    expect(verified(UserSkillsResolver.prototype.updateUserSkill)).toBe(true);
    expect(verified(UserSkillsResolver.prototype.removeUserSkills)).toBe(true);
    expect(verified(UserSkillsResolver.prototype.userSkills)).toBeUndefined();
  });
});
