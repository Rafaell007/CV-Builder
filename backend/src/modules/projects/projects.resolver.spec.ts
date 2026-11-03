import { Role } from "../../generated/prisma/enums";
import { ProjectsResolver } from "./projects.resolver";
import type { ProjectsService } from "./projects.service";

const PROJECT_ID = "6f1d3c52-8a0e-4f6c-9a43-2b7d5e1c9a10";

function setup() {
  const service = {
    list: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    create: jest.fn().mockResolvedValue({ id: PROJECT_ID }),
    update: jest.fn().mockResolvedValue({ id: PROJECT_ID }),
    delete: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<ProjectsService>;
  return { resolver: new ProjectsResolver(service), service };
}

describe("ProjectsResolver", () => {
  it("is for admins only (AC-3, AC-47)", () => {
    expect(Reflect.getMetadata("auth:roles", ProjectsResolver)).toEqual([Role.ADMIN]);
    expect(Reflect.getMetadata("auth:isPublic", ProjectsResolver)).toBeUndefined();
  });

  it("list passes the arguments to the service", async () => {
    const { resolver, service } = setup();
    const args = { search: "bank", page: { number: 1, size: 20 } };

    await expect(resolver.list(args)).resolves.toEqual({ items: [], total: 0 });

    expect(service.list).toHaveBeenCalledWith(args);
  });

  it("createProject and updateProject pass the input to the service", async () => {
    const { resolver, service } = setup();
    const input = { id: PROJECT_ID } as never;

    await resolver.createProject(input);
    await resolver.updateProject(input);

    expect(service.create).toHaveBeenCalledWith(input);
    expect(service.update).toHaveBeenCalledWith(input);
  });

  it("deleteProject returns true after the service deleted the project", async () => {
    const { resolver, service } = setup();

    await expect(resolver.deleteProject(PROJECT_ID)).resolves.toBe(true);

    expect(service.delete).toHaveBeenCalledWith(PROJECT_ID);
  });
});
