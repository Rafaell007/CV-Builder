import type { PrismaService } from "../../prisma/prisma.service";
import { ProjectRolesService } from "./project-roles.service";

describe("ProjectRolesService", () => {
  it("lists the roles by name", async () => {
    const roles = [{ id: "role-1", name: "Developer" }];
    const prisma = { projectRole: { findMany: jest.fn().mockResolvedValue(roles) } };

    await expect(new ProjectRolesService(prisma as unknown as PrismaService).list()).resolves.toBe(
      roles,
    );

    expect(prisma.projectRole.findMany).toHaveBeenCalledWith({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  });
});
