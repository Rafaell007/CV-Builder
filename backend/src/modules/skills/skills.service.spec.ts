import type { PrismaService } from "../../prisma/prisma.service";
import { SkillsService } from "./skills.service";

describe("SkillsService", () => {
  it("lists the skills by name", async () => {
    const skills = [{ id: "skill-1", name: "React" }];
    const prisma = { skill: { findMany: jest.fn().mockResolvedValue(skills) } };

    await expect(new SkillsService(prisma as unknown as PrismaService).list()).resolves.toBe(
      skills,
    );

    expect(prisma.skill.findMany).toHaveBeenCalledWith({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  });
});
