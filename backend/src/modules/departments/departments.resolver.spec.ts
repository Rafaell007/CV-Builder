import { Role } from "../../generated/prisma/enums";
import { DepartmentsResolver } from "./departments.resolver";
import type { DepartmentsService } from "./departments.service";

const DEPARTMENT_ID = "6f1d3c52-8a0e-4f6c-9a43-2b7d5e1c9a10";

function setup() {
  const service = {
    list: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    listOptions: jest.fn(),
    create: jest.fn().mockResolvedValue({ id: DEPARTMENT_ID }),
    update: jest.fn().mockResolvedValue({ id: DEPARTMENT_ID }),
    delete: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<DepartmentsService>;
  return { resolver: new DepartmentsResolver(service), service };
}

describe("DepartmentsResolver", () => {
  it.each(["list", "createDepartment", "updateDepartment", "deleteDepartment"] as const)(
    "%s is for admins only",
    (method) => {
      expect(Reflect.getMetadata("auth:roles", DepartmentsResolver.prototype[method])).toEqual([
        Role.ADMIN,
      ]);
    },
  );

  it("listOptions is for every signed-in user", () => {
    expect(
      Reflect.getMetadata("auth:roles", DepartmentsResolver.prototype.listOptions),
    ).toBeUndefined();
    expect(Reflect.getMetadata("auth:roles", DepartmentsResolver)).toBeUndefined();
    expect(Reflect.getMetadata("auth:isPublic", DepartmentsResolver)).toBeUndefined();
    expect(
      Reflect.getMetadata("auth:isPublic", DepartmentsResolver.prototype.listOptions),
    ).toBeUndefined();
  });

  it("listOptions returns the service's list", async () => {
    const { resolver, service } = setup();
    service.listOptions.mockResolvedValue([{ id: DEPARTMENT_ID, name: "Engineering" }]);

    await expect(resolver.listOptions()).resolves.toEqual([
      { id: DEPARTMENT_ID, name: "Engineering" },
    ]);
  });

  it("list passes the arguments to the service", async () => {
    const { resolver, service } = setup();
    const args = { search: "eng", page: { number: 1, size: 20 } };

    await expect(resolver.list(args)).resolves.toEqual({ items: [], total: 0 });

    expect(service.list).toHaveBeenCalledWith(args);
  });

  it("createDepartment and updateDepartment pass the input to the service", async () => {
    const { resolver, service } = setup();
    const input = { id: DEPARTMENT_ID, name: "Engineering" };

    await expect(resolver.createDepartment(input)).resolves.toEqual({ id: DEPARTMENT_ID });
    await expect(resolver.updateDepartment(input)).resolves.toEqual({ id: DEPARTMENT_ID });

    expect(service.create).toHaveBeenCalledWith(input);
    expect(service.update).toHaveBeenCalledWith(input);
  });

  it("deleteDepartment returns true after the service deleted the department", async () => {
    const { resolver, service } = setup();

    await expect(resolver.deleteDepartment(DEPARTMENT_ID)).resolves.toBe(true);

    expect(service.delete).toHaveBeenCalledWith(DEPARTMENT_ID);
  });
});
