import { Role } from "../../generated/prisma/enums";
import { PositionsResolver } from "./positions.resolver";
import type { PositionsService } from "./positions.service";

const POSITION_ID = "6f1d3c52-8a0e-4f6c-9a43-2b7d5e1c9a10";

function setup() {
  const service = {
    list: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    create: jest.fn().mockResolvedValue({ id: POSITION_ID }),
    update: jest.fn().mockResolvedValue({ id: POSITION_ID }),
    delete: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<PositionsService>;
  return { resolver: new PositionsResolver(service), service };
}

describe("PositionsResolver", () => {
  it("is for admins only", () => {
    expect(Reflect.getMetadata("auth:roles", PositionsResolver)).toEqual([Role.ADMIN]);
    expect(Reflect.getMetadata("auth:isPublic", PositionsResolver)).toBeUndefined();
  });

  it("list passes the arguments to the service", async () => {
    const { resolver, service } = setup();
    const args = { search: "dev", page: { number: 1, size: 20 } };

    await expect(resolver.list(args)).resolves.toEqual({ items: [], total: 0 });

    expect(service.list).toHaveBeenCalledWith(args);
  });

  it("createPosition and updatePosition pass the input to the service", async () => {
    const { resolver, service } = setup();
    const input = { id: POSITION_ID, name: "Developer" };

    await expect(resolver.createPosition(input)).resolves.toEqual({ id: POSITION_ID });
    await expect(resolver.updatePosition(input)).resolves.toEqual({ id: POSITION_ID });

    expect(service.create).toHaveBeenCalledWith(input);
    expect(service.update).toHaveBeenCalledWith(input);
  });

  it("deletePosition returns true after the service deleted the position", async () => {
    const { resolver, service } = setup();

    await expect(resolver.deletePosition(POSITION_ID)).resolves.toBe(true);

    expect(service.delete).toHaveBeenCalledWith(POSITION_ID);
  });
});
