import { ProjectRolesResolver } from "./project-roles.resolver";
import type { ProjectRolesService } from "./project-roles.service";

describe("ProjectRolesResolver", () => {
  it("returns the roles and is open to every signed-in user", async () => {
    const roles = [{ id: "role-1", name: "Developer" }];
    const service = { list: jest.fn().mockResolvedValue(roles) } as unknown as ProjectRolesService;

    await expect(new ProjectRolesResolver(service).projectRoles()).resolves.toBe(roles);

    expect(Reflect.getMetadata("auth:roles", ProjectRolesResolver)).toBeUndefined();
    expect(Reflect.getMetadata("auth:isPublic", ProjectRolesResolver)).toBeUndefined();
  });
});
