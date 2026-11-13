import { Role } from "../../generated/prisma/enums";
import { SkillsResolver } from "./skills.resolver";
import type { SkillsService } from "./skills.service";

describe("SkillsResolver", () => {
  it("returns the skills and is restricted to admins", async () => {
    const skills = [{ id: "skill-1", name: "React" }];
    const service = { list: jest.fn().mockResolvedValue(skills) } as unknown as SkillsService;

    await expect(new SkillsResolver(service).list()).resolves.toBe(skills);

    expect(Reflect.getMetadata("auth:roles", SkillsResolver)).toEqual([Role.ADMIN]);
  });
});
