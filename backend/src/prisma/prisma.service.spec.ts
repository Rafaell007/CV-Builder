import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaService } from "./prisma.service";

jest.mock("@prisma/adapter-pg", () => {
  const actual = jest.requireActual<typeof import("@prisma/adapter-pg")>("@prisma/adapter-pg");

  return {
    PrismaPg: jest
      .fn()
      .mockImplementation(
        (options: ConstructorParameters<typeof actual.PrismaPg>[0]) => new actual.PrismaPg(options),
      ),
  };
});

const DATABASE_URL = "postgresql://u:p@localhost:5432/db";

describe("PrismaService", () => {
  const createService = async (): Promise<PrismaService> => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PrismaService,
        { provide: ConfigService, useValue: { getOrThrow: () => DATABASE_URL } },
      ],
    }).compile();

    return moduleRef.get(PrismaService);
  };

  it("builds the client on the pg driver adapter with DATABASE_URL", async () => {
    await createService();

    expect(PrismaPg).toHaveBeenCalledWith({ connectionString: DATABASE_URL });
  });

  it("runs a real query on startup so a missing database fails fast", async () => {
    const service = await createService();
    const query = jest.spyOn(service, "$queryRaw").mockResolvedValue([{ "?column?": 1 }]);

    await service.onModuleInit();

    expect(query).toHaveBeenCalledTimes(1);
  });

  it("rejects on startup when the database is unreachable", async () => {
    const service = await createService();
    jest.spyOn(service, "$queryRaw").mockRejectedValue(new Error("connect ECONNREFUSED"));

    await expect(service.onModuleInit()).rejects.toThrow("ECONNREFUSED");
  });

  it("fails when DATABASE_URL is missing", async () => {
    const config = {
      getOrThrow: () => {
        throw new Error("DATABASE_URL does not exist");
      },
    };

    await expect(
      Test.createTestingModule({
        providers: [PrismaService, { provide: ConfigService, useValue: config }],
      }).compile(),
    ).rejects.toThrow("DATABASE_URL");
  });
});
