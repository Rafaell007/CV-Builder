import { Role } from "../../generated/prisma/enums";
import { SkillsResolver } from "./skills.resolver";
import type { SkillsService } from "./skills.service";

const SKILL_ID = "6f1d3c52-8a0e-4f6c-9a43-2b7d5e1c9a10";
const CATEGORY_ID = "0b5e2f1a-3c4d-4e5f-8a9b-1c2d3e4f5a6b";

function setup() {
  const service = {
    list: jest.fn().mockResolvedValue([{ id: SKILL_ID, name: "React" }]),
    listPage: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    listCategories: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({ id: SKILL_ID }),
    update: jest.fn().mockResolvedValue({ id: SKILL_ID }),
    delete: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<SkillsService>;
  return { resolver: new SkillsResolver(service), service };
}

describe("SkillsResolver", () => {
  it("is for admins only", () => {
    expect(Reflect.getMetadata("auth:roles", SkillsResolver)).toEqual([Role.ADMIN]);
    expect(Reflect.getMetadata("auth:isPublic", SkillsResolver)).toBeUndefined();
  });

  it("list returns the skills of the service", async () => {
    const { resolver } = setup();

    await expect(resolver.list()).resolves.toEqual([{ id: SKILL_ID, name: "React" }]);
  });

  it("listPage passes the arguments to the service", async () => {
    const { resolver, service } = setup();
    const args = { search: "rea", page: { number: 1, size: 20 } };

    await expect(resolver.listPage(args)).resolves.toEqual({ items: [], total: 0 });

    expect(service.listPage).toHaveBeenCalledWith(args);
  });

  it("listCategories returns the categories of the service", async () => {
    const { resolver, service } = setup();

    await expect(resolver.listCategories()).resolves.toEqual([]);

    expect(service.listCategories).toHaveBeenCalled();
  });

  it("createSkill and updateSkill pass the input to the service", async () => {
    const { resolver, service } = setup();
    const input = { id: SKILL_ID, name: "React", categoryId: CATEGORY_ID };

    await expect(resolver.createSkill(input)).resolves.toEqual({ id: SKILL_ID });
    await expect(resolver.updateSkill(input)).resolves.toEqual({ id: SKILL_ID });

    expect(service.create).toHaveBeenCalledWith(input);
    expect(service.update).toHaveBeenCalledWith(input);
  });

  it("deleteSkill returns true after the service deleted the skill", async () => {
    const { resolver, service } = setup();

    await expect(resolver.deleteSkill(SKILL_ID)).resolves.toBe(true);

    expect(service.delete).toHaveBeenCalledWith(SKILL_ID);
  });
});
